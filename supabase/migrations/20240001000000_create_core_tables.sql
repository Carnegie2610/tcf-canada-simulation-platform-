-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. PROFILES TABLE
-- =========================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    assigned_plan VARCHAR(50) NOT NULL DEFAULT 'PLAN_5000' CHECK (assigned_plan IN ('PLAN_5000', 'PLAN_10000', 'PLAN_15000', 'PLAN_20000')),
    simulations_quota INTEGER NOT NULL DEFAULT 35,
    simulations_remaining INTEGER NOT NULL DEFAULT 35,
    ai_corrections_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT chk_quota_bounds CHECK (simulations_remaining >= 0 AND simulations_remaining <= simulations_quota)
);

-- =========================================================================
-- 2. EXAMS TABLE
-- =========================================================================
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    section VARCHAR(50) NOT NULL CHECK (section IN ('SECTION_A', 'SECTION_B')),
    prompt_text TEXT NOT NULL,
    min_words INTEGER NOT NULL DEFAULT 150 CHECK (min_words > 0),
    max_duration INTEGER NOT NULL DEFAULT 40 CHECK (max_duration > 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. SUBMISSIONS TABLE
-- =========================================================================
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    user_draft TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT unique_student_exam_attempt UNIQUE (user_id, exam_id)
);

-- =========================================================================
-- 4. EVALUATIONS TABLE
-- =========================================================================
CREATE TABLE public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
    cefr_level VARCHAR(10) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    global_score INTEGER NOT NULL CHECK (global_score >= 0 AND global_score <= 100),
    grammar_score INTEGER NOT NULL CHECK (grammar_score >= 0 AND grammar_score <= 20),
    lexical_score INTEGER NOT NULL CHECK (lexical_score >= 0 AND lexical_score <= 20),
    coherence_score INTEGER NOT NULL CHECK (coherence_score >= 0 AND coherence_score <= 20),
    json_feedback JSONB NOT NULL,
    model_answer_c2 TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
