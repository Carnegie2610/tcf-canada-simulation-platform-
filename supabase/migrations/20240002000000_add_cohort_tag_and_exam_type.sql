ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_tag VARCHAR(100);

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS exam_type VARCHAR(10) NOT NULL DEFAULT 'TEF'
    CHECK (exam_type IN ('TEF', 'TCF'));

CREATE INDEX IF NOT EXISTS idx_profiles_cohort_tag ON public.profiles(cohort_tag);
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON public.exams(exam_type);
