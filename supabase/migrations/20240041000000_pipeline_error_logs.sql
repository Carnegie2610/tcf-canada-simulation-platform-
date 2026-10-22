CREATE TABLE public.pipeline_error_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  exam_type       VARCHAR(20) NOT NULL CHECK (exam_type IN ('EE', 'EE_combination', 'EO')),
  stage           VARCHAR(50) NOT NULL,
  provider        VARCHAR(20),
  error_message   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pipeline_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pipeline error logs"
  ON public.pipeline_error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
-- No INSERT/UPDATE/DELETE policy — only the service-role admin client writes rows.

CREATE INDEX idx_pipeline_error_logs_created_at ON public.pipeline_error_logs (created_at DESC);
CREATE INDEX idx_pipeline_error_logs_submission ON public.pipeline_error_logs (submission_id);
CREATE INDEX idx_pipeline_error_logs_user ON public.pipeline_error_logs (user_id);
