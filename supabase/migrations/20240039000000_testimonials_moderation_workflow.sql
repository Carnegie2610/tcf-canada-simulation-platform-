-- Pivot testimonials from "admin authors it" to "student/visitor submits it,
-- admin moderates it": replace the simple is_published flag with a proper
-- pending/approved/rejected status, track who submitted it (a student's own
-- account, or an anonymous IP for rate-limiting), and who reviewed it.

ALTER TABLE public.testimonials
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

UPDATE public.testimonials
  SET status = CASE WHEN is_published THEN 'approved' ELSE 'pending' END;

-- Must drop the old policy before the column it depends on, or Postgres
-- refuses the DROP COLUMN below with "other objects depend on it".
DROP POLICY IF EXISTS "Anyone reads published testimonials" ON public.testimonials;

ALTER TABLE public.testimonials
  DROP COLUMN is_published;

ALTER TABLE public.testimonials
  ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN submitter_ip TEXT,
  ADD COLUMN reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at TIMESTAMPTZ;

ALTER TABLE public.testimonials
  DROP COLUMN created_by;

CREATE POLICY "Anyone reads approved testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- A logged-in student may submit their own testimonial, but only ever as
-- pending — they can never self-approve.
CREATE POLICY "Students submit own pending testimonial"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- "Admins manage testimonials" (FOR ALL) already exists from the previous
-- migration and still covers the moderation queue's read-all/update/delete
-- needs unchanged.
