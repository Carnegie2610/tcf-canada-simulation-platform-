CREATE TABLE public.oral_evaluations (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id      UUID UNIQUE NOT NULL
                     REFERENCES public.oral_submissions(id) ON DELETE CASCADE,
  global_score       NUMERIC(4,2) NOT NULL,
  cefr_level         VARCHAR(2)  NOT NULL,
  appreciation       VARCHAR(20) NOT NULL,
  task_1_evaluation  JSONB NOT NULL,
  task_2_evaluation  JSONB NOT NULL,
  task_3_evaluation  JSONB NOT NULL,
  transcript_task_1  TEXT NOT NULL DEFAULT '',
  transcript_task_2  TEXT NOT NULL DEFAULT '',
  transcript_task_3  TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.oral_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own oral evaluations"
  ON public.oral_evaluations FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM public.oral_submissions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all oral evaluations"
  ON public.oral_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
