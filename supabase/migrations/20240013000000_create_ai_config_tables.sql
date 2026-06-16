-- Stores editable AI system prompts managed via super-admin UI
CREATE TABLE public.ai_prompts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_key  VARCHAR(100) UNIQUE NOT NULL,
  prompt_text TEXT NOT NULL,
  description VARCHAR(255),
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
-- No student-facing policies — only service role (admin client) reads/writes this table.

-- Tracks AI API calls per provider for the usage dashboard
CREATE TABLE public.ai_api_calls (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_type VARCHAR(20)  NOT NULL,
  provider        VARCHAR(20)  NOT NULL,
  model           VARCHAR(50)  NOT NULL,
  success         BOOLEAN      NOT NULL DEFAULT true,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ  DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_api_calls ENABLE ROW LEVEL SECURITY;
-- No student-facing policies — only service role reads/writes this table.
