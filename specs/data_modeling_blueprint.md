# Data Modeling Blueprint

This document defines the relational database architecture, structural constraints, and strict data quality validation rules for the TEF/TCF Canada exam preparation platform.

## 1. Entity-Relationship Diagram (ERD)

```
  ┌──────────────────────────────────────────┐
  │                 profiles                 │
  ├──────────────────────────────────────────┤
  │ PK  id                      UUID         │ <───┐
  │     email                   VARCHAR      │     │
  │     full_name               VARCHAR      │     │
  │     role                    VARCHAR      │     │
  │     assigned_plan           VARCHAR      │     │
  │     simulations_quota       INTEGER      │     │
  │     simulations_remaining   INTEGER      │     │
  │     ai_corrections_enabled  BOOLEAN      │     │
  │     expires_at              TIMESTAMPTZ  │     │
  │     created_at              TIMESTAMPTZ  │     │
  └──────────────────────────────────────────┘     │
                       │ (1)                       │ (1)
                       │ (1..N)                    │ (1..N)
  ┌──────────────────────────────────────────┐     │
  │               submissions                │     │
  ├──────────────────────────────────────────┤     │
  │ PK  id                      UUID         │     │
  │ FK  user_id                 UUID         │ ────┘
  │ FK  exam_id                 UUID         │ ────┐
  │     user_draft              TEXT         │     │
  │     word_count              INTEGER      │     │
  │     is_completed            BOOLEAN      │     │
  │     completed_at            TIMESTAMPTZ  │     │
  │     created_at              TIMESTAMPTZ  │     │
  └──────────────────────────────────────────┘     │
                       │ (1)                       │ (1)
                       │ (0..1)                    │
  ┌──────────────────────────────────────────┐     │
  │               evaluations                │     │
  ├──────────────────────────────────────────┤     │
  │ PK  id                      UUID         │     │
  │ FK  submission_id           UUID         │     │
  │     cefr_level              VARCHAR      │     │
  │     global_score            INTEGER      │     │
  │     grammar_score           INTEGER      │     │
  │     lexical_score           INTEGER      │     │
  │     coherence_score         INTEGER      │     │
  │     json_feedback           JSONB        │     │
  │     model_answer_c2         TEXT         │     │
  │     created_at              TIMESTAMPTZ  │     │
  └──────────────────────────────────────────┘     │
                                                   │ (1..N)
  ┌──────────────────────────────────────────┐     │
  │                  exams                   │     │
  ├──────────────────────────────────────────┤     │
  │ PK  id                      UUID         │ <───┘
  │     title                   VARCHAR      │
  │     section                 VARCHAR      │
  │     prompt_text             TEXT         │
  │     min_words               INTEGER      │
  │     max_duration            INTEGER      │
  │     created_at              TIMESTAMPTZ  │
  └──────────────────────────────────────────┘
```

## 2. Migration Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20240001000000_create_core_tables.sql` | All four tables with constraints |
| `supabase/migrations/20240001000001_create_indexes.sql` | Performance indexes |
| `supabase/migrations/20240001000002_create_quota_procedure.sql` | `verify_and_consume_quota` function |

## 3. Key Constraints

- `profiles.role` — `('student', 'admin', 'super_admin')`
- `profiles.assigned_plan` — `('PLAN_5000', 'PLAN_10000', 'PLAN_15000', 'PLAN_20000')`
- `profiles.chk_quota_bounds` — `simulations_remaining >= 0 AND simulations_remaining <= simulations_quota`
- `exams.section` — `('SECTION_A', 'SECTION_B')`
- `submissions` — `UNIQUE(user_id, exam_id)` — one attempt per student per exam
- `evaluations.cefr_level` — `('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`
- `evaluations.global_score` — 0–100
- `evaluations.grammar_score / lexical_score / coherence_score` — 0–20

## 4. Zod Schemas (src/lib/schemas.ts)

### SubmissionInputSchema
Validates client → server draft payloads:
- `userId` / `examId` — UUID format
- `userDraft` — min 10, max 8000 chars, no `<>` characters
- `wordCount` — non-negative integer ≥ 1

### DiagnosticReportSchema
Validates AI API → backend evaluation payloads:
- `cefrLevel` — CEFR enum
- `globalScore` — 0–100
- `criteriaMetrics.grammarScore / lexicalScore / coherenceScore` — 0–20
- `corrections[]` — `errorType` enum in French: `Grammaire | Orthographe | Syntaxe | Vocabulaire | Ponctuation`
- `modelAnswerC2` — min 50 chars

## 5. verify_and_consume_quota Procedure

```sql
SELECT verify_and_consume_quota('<user-uuid>');
-- Returns TRUE if: profile exists AND expires_at > NOW() AND simulations_remaining > 0
-- Side effect: atomically decrements simulations_remaining by 1
```

Always call this inside API routes before initializing a simulation or triggering AI evaluation. Never write manual credit deduction queries.

## 6. UPSERT Autosave Pattern

```sql
INSERT INTO public.submissions (user_id, exam_id, user_draft, word_count)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, exam_id)
DO UPDATE SET user_draft = EXCLUDED.user_draft, word_count = EXCLUDED.word_count;
```
