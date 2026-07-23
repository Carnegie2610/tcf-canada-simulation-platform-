-- Allow admins and super_admins to read all combination evaluations
-- (required for the admin audit panel to display Arena/combination results)
CREATE POLICY "Admins read all combination evaluations"
  ON public.combination_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
