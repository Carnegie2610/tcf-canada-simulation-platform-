
Skill: Quota Transaction Locks

Context

Use this skill when executing simulation starts, validating user credits, and managing credit updates.

Guidelines

Atomic Deduction Rules: Always consume simulation credits atomically using database routines (verify_and_consume_quota) before loading writing workspaces or triggering evaluations.

Deduplication: Block the creation of duplicate submissions via database-level UNIQUE restraints.

Code Patterns

Atomic PL/pgSQL Quota Lock

CREATE OR REPLACE FUNCTION verify_and_consume_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF (SELECT simulations_remaining FROM public.profiles WHERE id = p_user_id) <= 0 THEN
        RETURN FALSE;
    END IF;
    UPDATE public.profiles 
    SET simulations_remaining = simulations_remaining - 1 
    WHERE id = p_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


