-- Admin/super_admin accounts are staff, not students, and don't need a subscription
-- plan/quota/expiry. Make those columns nullable, but keep a DB-level guarantee that
-- students always retain them.

ALTER TABLE public.profiles
  ALTER COLUMN assigned_plan DROP NOT NULL,
  ALTER COLUMN simulations_quota DROP NOT NULL,
  ALTER COLUMN simulations_remaining DROP NOT NULL,
  ALTER COLUMN expires_at DROP NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_check
  CHECK (assigned_plan IS NULL OR assigned_plan IN ('PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_quota_bounds;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_quota_bounds
  CHECK (simulations_quota IS NULL OR (simulations_remaining >= 0 AND simulations_remaining <= simulations_quota));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_students_require_plan
  CHECK (role != 'student' OR (assigned_plan IS NOT NULL AND simulations_quota IS NOT NULL AND expires_at IS NOT NULL));

-- Guard against silently granting unlimited quota if this is ever called for a
-- staff account with no plan (NULL comparisons short-circuit the two IF checks
-- below without erroring, previously falling through to a NULL - 1 update that
-- returns TRUE).
CREATE OR REPLACE FUNCTION verify_and_consume_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_expires TIMESTAMPTZ;
    v_remaining INTEGER;
BEGIN
    SELECT expires_at, simulations_remaining
    INTO v_expires, v_remaining
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_expires IS NULL OR v_remaining IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_expires < NOW() THEN
        RETURN FALSE;
    END IF;

    IF v_remaining <= 0 THEN
        RETURN FALSE;
    END IF;

    UPDATE public.profiles
    SET simulations_remaining = simulations_remaining - 1
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
