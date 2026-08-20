-- What the applicant says they want, captured at sign-up so the admin can
-- pre-select it at approval instead of asking again.
--
-- Intentionally unconstrained by the plan CHECK used on profiles: this records a
-- preference, not an entitlement. The binding decision is made by the admin in
-- the create-user form, which is where the real constraints apply.

ALTER TABLE public.signup_requests
  ADD COLUMN desired_plan_ee VARCHAR(50),
  ADD COLUMN desired_plan_eo VARCHAR(50);
