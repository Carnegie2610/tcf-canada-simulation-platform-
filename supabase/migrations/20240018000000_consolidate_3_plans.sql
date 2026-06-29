-- Consolidate to 3-plan model: PLAN_5000, PLAN_10000, PLAN_30000
-- WARNING: Migrate any existing users with PLAN_2000, PLAN_3000, PLAN_15000, or PLAN_20000
-- before applying this migration, or update them to a valid plan first.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_check
  CHECK (assigned_plan IN ('PLAN_5000', 'PLAN_10000', 'PLAN_30000'));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('PLAN_5000', 'PLAN_10000', 'PLAN_30000'));
