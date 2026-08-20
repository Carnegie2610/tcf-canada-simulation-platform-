-- Public sign-up requests awaiting admin approval.
--
-- Deliberately NOT an auth user yet: a student can't self-assign a paid pack, and
-- a half-provisioned account with no plan would violate chk_students_require_plan
-- and break the dashboard's profile lookup. So a request is just a record; the
-- real account is created through the normal admin flow on approval, which is
-- also where the pack and payment are decided.
--
-- No password is stored here — passwords only ever exist inside Supabase Auth,
-- hashed. The admin sets one when creating the approved account.

CREATE TABLE public.signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_signup_requests_status ON public.signup_requests (status, created_at DESC);

ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;

-- The form is public, so anonymous visitors must be able to submit. Insert only:
-- nobody unauthenticated can read back what others have submitted.
CREATE POLICY "Anyone can submit a signup request"
  ON public.signup_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read signup requests"
  ON public.signup_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Admins update signup requests"
  ON public.signup_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );
