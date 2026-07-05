-- Add PLAN_2000 and PLAN_3000 as admin-only plans (creation interface only)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_check
  CHECK (assigned_plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000'));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000'));
