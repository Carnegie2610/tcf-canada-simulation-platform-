CREATE TABLE public.oral_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  oral_combination_id   UUID NOT NULL REFERENCES public.oral_combinations(id) ON DELETE CASCADE,
  audio_path_task_1     TEXT,
  audio_path_task_2     TEXT,
  audio_path_task_3     TEXT,
  pipeline_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (pipeline_status IN ('pending', 'processing', 'failed', 'completed')),
  is_completed          BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_student_oral_combination UNIQUE (user_id, oral_combination_id)
);

ALTER TABLE public.oral_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own oral submissions"
  ON public.oral_submissions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all oral submissions"
  ON public.oral_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_oral_subs_user ON public.oral_submissions(user_id);
CREATE INDEX idx_oral_subs_combination ON public.oral_submissions(oral_combination_id);
