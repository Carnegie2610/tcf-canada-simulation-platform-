ALTER TABLE public.oral_submissions
  ADD COLUMN audio_deleted_at TIMESTAMPTZ;

CREATE INDEX idx_oral_subs_cleanup
  ON public.oral_submissions (pipeline_status, completed_at)
  WHERE audio_deleted_at IS NULL;
