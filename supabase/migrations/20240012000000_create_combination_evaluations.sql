CREATE TABLE public.combination_evaluations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id    UUID UNIQUE NOT NULL
                   REFERENCES public.combination_submissions(id) ON DELETE CASCADE,
  global_score     NUMERIC(4,2) NOT NULL,
  cefr_level       VARCHAR(2)  NOT NULL,
  appreciation     VARCHAR(20) NOT NULL,
  task_1_evaluation JSONB NOT NULL,
  task_2_evaluation JSONB NOT NULL,
  task_3_evaluation JSONB NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.combination_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own combination evaluations"
  ON public.combination_evaluations FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM public.combination_submissions WHERE user_id = auth.uid()
    )
  );
