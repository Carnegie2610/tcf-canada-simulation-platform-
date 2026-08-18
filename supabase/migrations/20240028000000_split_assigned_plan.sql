-- Replace the single `assigned_plan` column with independent EE and EO pack
-- selections, so admins can assign each skill's pack separately instead of a
-- single joint "Mix" plan. Every purchase now maps to an unambiguous EE (35%)
-- or EO (30%) commission rate.

-- 1. New columns
ALTER TABLE public.profiles
  ADD COLUMN assigned_plan_ee VARCHAR(50),
  ADD COLUMN assigned_plan_eo VARCHAR(50);

-- 2. Backfill from the old single column. Legacy PLAN_MIX_* rows have no clean
-- 1:1 split into an equivalent single EE/EO pack key, so they're left NULL here
-- — their quotas are already correct and independent, only the display label
-- is affected, not functionality.
UPDATE public.profiles
SET assigned_plan_ee = assigned_plan
WHERE assigned_plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000');

UPDATE public.profiles
SET assigned_plan_eo = assigned_plan
WHERE assigned_plan IN ('PLAN_EO_2000', 'PLAN_EO_3000', 'PLAN_EO_5000', 'PLAN_EO_10000');

-- 3. Drop the old column and its constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_students_require_plan;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  DROP COLUMN assigned_plan;

-- 4. New constraints on the split columns
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_ee_check
  CHECK (assigned_plan_ee IS NULL OR assigned_plan_ee IN (
    'PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000'
  ));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_eo_check
  CHECK (assigned_plan_eo IS NULL OR assigned_plan_eo IN (
    'PLAN_EO_2000', 'PLAN_EO_3000', 'PLAN_EO_5000', 'PLAN_EO_10000'
  ));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_students_require_plan
  CHECK (role != 'student' OR (
    (assigned_plan_ee IS NOT NULL OR assigned_plan_eo IS NOT NULL)
    AND ee_simulations_quota IS NOT NULL
    AND eo_simulations_quota IS NOT NULL
    AND expires_at IS NOT NULL
  ));
