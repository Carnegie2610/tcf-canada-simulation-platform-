-- Support tickets get a two-way message thread (student <-> admin replies) and
-- admin-managed categories students pick from when submitting a new ticket.

-- =========================================================================
-- 1. TICKET CATEGORIES (admin-managed, e.g. "Problème de connexion")
-- =========================================================================
CREATE TABLE public.ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read the category list (needed to populate the
-- student submission form's dropdown).
CREATE POLICY "Authenticated users read categories"
  ON public.ticket_categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage categories"
  ON public.ticket_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =========================================================================
-- 2. support_tickets — add optional category
-- =========================================================================
ALTER TABLE public.support_tickets
  ADD COLUMN category_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL;

-- =========================================================================
-- 3. TICKET MESSAGES — the reply thread (first ticket message stays on
-- support_tickets.message; every reply after that, from either side, lives here)
-- =========================================================================
CREATE TABLE public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'admin')),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Students can read/insert messages only on their own ticket.
CREATE POLICY "Users read own ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert messages on own ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Admins can read/insert messages on any ticket.
CREATE POLICY "Admins read all ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins insert ticket messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
