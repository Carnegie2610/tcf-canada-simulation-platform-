CREATE TABLE public.combinations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    exam_type       VARCHAR(10)  NOT NULL CHECK (exam_type IN ('TEF', 'TCF')),
    global_duration INTEGER      NOT NULL CHECK (global_duration > 0),
    tasks           JSONB        NOT NULL,
    created_at      TIMESTAMPTZ  DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.combinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read combinations"
  ON public.combinations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage combinations"
  ON public.combinations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_combinations_exam_type ON public.combinations(exam_type);
CREATE INDEX idx_combinations_created_at ON public.combinations(created_at DESC);
