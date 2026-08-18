-- Split the single simulations_quota/simulations_remaining pool on profiles into
-- separate Expression Écrite (EE) and Expression Orale (EO) counters, so the new
-- EO-only and EE+EO "mix" plans can grant independent quotas per skill.

-- 1. New per-skill quota columns
ALTER TABLE public.profiles
  ADD COLUMN ee_simulations_quota INTEGER,
  ADD COLUMN ee_simulations_remaining INTEGER,
  ADD COLUMN eo_simulations_quota INTEGER,
  ADD COLUMN eo_simulations_remaining INTEGER;

-- 2. Backfill: all existing quota was Expression Écrite (Expression Orale simulations
-- did not exist yet when these students enrolled). EO starts at 0 for everyone.
UPDATE public.profiles
SET ee_simulations_quota = simulations_quota,
    ee_simulations_remaining = simulations_remaining,
    eo_simulations_quota = CASE WHEN role = 'student' THEN 0 ELSE NULL END,
    eo_simulations_remaining = CASE WHEN role = 'student' THEN 0 ELSE NULL END;

-- 3. Drop the old single-pool columns and the constraints tied to them
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_quota_bounds;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_students_require_plan;

ALTER TABLE public.profiles
  DROP COLUMN simulations_quota,
  DROP COLUMN simulations_remaining;

-- 4. New bounds constraints (nullable for staff, same pattern as the old single-pool one)
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_ee_quota_bounds
  CHECK (ee_simulations_quota IS NULL OR (ee_simulations_remaining >= 0 AND ee_simulations_remaining <= ee_simulations_quota));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_eo_quota_bounds
  CHECK (eo_simulations_quota IS NULL OR (eo_simulations_remaining >= 0 AND eo_simulations_remaining <= eo_simulations_quota));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_students_require_plan
  CHECK (role != 'student' OR (
    assigned_plan IS NOT NULL
    AND ee_simulations_quota IS NOT NULL
    AND eo_simulations_quota IS NOT NULL
    AND expires_at IS NOT NULL
  ));

-- 5. Widen assigned_plan / payments.plan to the new 13-plan catalogue
-- (5 existing Expression Écrite plans, unchanged, plus 4 new Expression Orale
-- plans and 4 new EE+EO "mix" plans).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_plan_check
  CHECK (assigned_plan IS NULL OR assigned_plan IN (
    'PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000',
    'PLAN_EO_2000', 'PLAN_EO_3000', 'PLAN_EO_5000', 'PLAN_EO_10000',
    'PLAN_MIX_4000', 'PLAN_MIX_5000', 'PLAN_MIX_10000', 'PLAN_MIX_20000'
  ));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN (
    'PLAN_2000', 'PLAN_3000', 'PLAN_5000', 'PLAN_10000', 'PLAN_30000',
    'PLAN_EO_2000', 'PLAN_EO_3000', 'PLAN_EO_5000', 'PLAN_EO_10000',
    'PLAN_MIX_4000', 'PLAN_MIX_5000', 'PLAN_MIX_10000', 'PLAN_MIX_20000'
  ));

-- 6. Rewrite the quota procedure to target the right pool for the given skill —
-- breaking change to its signature (now takes p_skill_type: 'ee' | 'eo'), all 3
-- submission-creation API routes are updated to pass it.
CREATE OR REPLACE FUNCTION verify_and_consume_quota(p_user_id UUID, p_skill_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_expires TIMESTAMPTZ;
    v_remaining INTEGER;
BEGIN
    IF p_skill_type NOT IN ('ee', 'eo') THEN
        RETURN FALSE;
    END IF;

    IF p_skill_type = 'ee' THEN
        SELECT expires_at, ee_simulations_remaining INTO v_expires, v_remaining
        FROM public.profiles WHERE id = p_user_id;
    ELSE
        SELECT expires_at, eo_simulations_remaining INTO v_expires, v_remaining
        FROM public.profiles WHERE id = p_user_id;
    END IF;

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

    IF p_skill_type = 'ee' THEN
        UPDATE public.profiles SET ee_simulations_remaining = ee_simulations_remaining - 1 WHERE id = p_user_id;
    ELSE
        UPDATE public.profiles SET eo_simulations_remaining = eo_simulations_remaining - 1 WHERE id = p_user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
