
Skill: DB Schema Management

Context

Use this skill when modifying, migrating, or writing performance indexes for the PostgreSQL / Supabase database structures.

Guidelines

Constraint Compliance: Never bypass database-level constraints. Every table must enforce strict relationships at the PostgreSQL layer.

Stored Procedures over ORMs: Write direct, optimized PL/pgSQL scripts instead of ORMs when executing critical database validations or transaction operations.

Index Strategy: Every query matching lookup dashboards or student tables must be backed by a corresponding Postgres performance index (e.g., compound indexes on (user_id, exam_id)).

Code Patterns

Schema Migration Setup

-- Always use standard relational constraints and CASCADE rules
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    user_draft TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_student_exam_attempt UNIQUE (user_id, exam_id)
);


