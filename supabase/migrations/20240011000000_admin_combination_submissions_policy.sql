-- Allow admins and super_admins to read all combination submissions
-- (required for the admin dashboard activity feed)
CREATE POLICY "Admins read all combination submissions"
  ON public.combination_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
