-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────

-- Students can read only their own profile row
CREATE POLICY "students_read_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "admins_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert and update profiles
CREATE POLICY "admins_insert_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admins_update_profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ── exams ─────────────────────────────────────────────────────────────────────

-- Any authenticated user can read exams
CREATE POLICY "authenticated_read_exams"
  ON public.exams FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── submissions ───────────────────────────────────────────────────────────────

-- Students can read and write only their own submissions
CREATE POLICY "students_read_own_submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "students_insert_own_submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "students_update_own_submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- ── evaluations ───────────────────────────────────────────────────────────────

-- Students can read evaluations linked to their own submissions
CREATE POLICY "students_read_own_evaluations"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE submissions.id = evaluations.submission_id
        AND submissions.user_id = auth.uid()
    )
  );
