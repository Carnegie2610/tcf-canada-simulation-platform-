-- Drop the inline CHECK constraint on payments.plan (system-generated name, unknown at write time)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.payments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%plan IN%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Add correctly named constraint covering all active plans
ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_15000'));
