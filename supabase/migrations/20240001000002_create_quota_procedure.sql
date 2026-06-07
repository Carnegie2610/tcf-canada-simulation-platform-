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
