-- Widen profiles assigned_plan CHECK to include PLAN_2000 and PLAN_3000
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_check
  CHECK (assigned_plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_15000', 'PLAN_20000'));

-- Widen payments plan CHECK to include PLAN_2000 and PLAN_3000
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_15000'));
