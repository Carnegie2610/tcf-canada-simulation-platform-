-- Admin-authored announcements broadcast to every student, plus per-user read
-- tracking shared by announcements and admin ticket replies.

-- =========================================================================
-- 1. ANNOUNCEMENTS (one row, seen by all students)
-- =========================================================================
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read announcements"
  ON public.announcements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- =========================================================================
-- 2. READ TRACKING
-- =========================================================================
-- One table for both notification kinds rather than a read-flag per source:
-- announcements are shared rows (a per-row flag couldn't express "read by Marie
-- but not by Paul"), and ticket replies need the same treatment. Absence of a
-- row means unread, so nothing has to be back-filled when a new item appears.
CREATE TABLE public.notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('announcement', 'ticket_message')),
    source_id UUID NOT NULL,
    read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT unique_user_notification UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX idx_notification_reads_user ON public.notification_reads (user_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Deliberately scoped to the caller's own rows: this is the one table students
-- write to directly, so both the row they read and the row they create are
-- pinned to auth.uid().
CREATE POLICY "Users read own notification reads"
  ON public.notification_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notification reads"
  ON public.notification_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
