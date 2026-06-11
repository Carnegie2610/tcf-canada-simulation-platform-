CREATE TABLE public.combination_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  combination_id   UUID NOT NULL REFERENCES public.combinations(id) ON DELETE CASCADE,
  draft_task_1     TEXT NOT NULL DEFAULT '',
  draft_task_2     TEXT NOT NULL DEFAULT '',
  draft_task_3     TEXT NOT NULL DEFAULT '',
  word_count_1     INTEGER NOT NULL DEFAULT 0,
  word_count_2     INTEGER NOT NULL DEFAULT 0,
  word_count_3     INTEGER NOT NULL DEFAULT 0,
  is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_student_combination UNIQUE (user_id, combination_id)
);

ALTER TABLE public.combination_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own combination submissions"
  ON public.combination_submissions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_combo_subs_user ON public.combination_submissions(user_id);
CREATE INDEX idx_combo_subs_combination ON public.combination_submissions(combination_id);
