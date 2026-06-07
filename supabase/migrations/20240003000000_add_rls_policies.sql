-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PROFILES
-- =========================================================================

-- Users can read their own profile (required for login role check)
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert profiles (for user creation via admin panel)
CREATE POLICY "Admins insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =========================================================================
-- SUBMISSIONS
-- =========================================================================

-- Users can read their own submissions
CREATE POLICY "Users read own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users insert own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions (autosave)
CREATE POLICY "Users update own submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all submissions
CREATE POLICY "Admins read all submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =========================================================================
-- EVALUATIONS
-- =========================================================================

-- Users can read evaluations for their own submissions
CREATE POLICY "Users read own evaluations"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = evaluations.submission_id
        AND user_id = auth.uid()
    )
  );

-- Admins can read all evaluations
CREATE POLICY "Admins read all evaluations"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Service role inserts evaluations (AI route uses service key, bypasses RLS)

-- =========================================================================
-- EXAMS
-- =========================================================================

-- All authenticated users can read exams (needed for simulation)
CREATE POLICY "Authenticated users read exams"
  ON public.exams FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can insert/update/delete exams
CREATE POLICY "Admins manage exams"
  ON public.exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
