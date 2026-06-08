CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Students can insert their own tickets
CREATE POLICY "Users insert own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can read their own tickets
CREATE POLICY "Users read own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all tickets
CREATE POLICY "Admins read all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update ticket status
CREATE POLICY "Admins update tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
