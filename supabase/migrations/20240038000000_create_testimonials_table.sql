-- Admin-authored student testimonials shown on the public landing page.
-- Unlike announcements (read by logged-in students only), this table is read
-- by anonymous visitors too, since the landing page has no login wall.

CREATE TABLE public.testimonials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    role_text     VARCHAR(255),
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content       TEXT NOT NULL,
    avatar_path   TEXT,
    is_published  BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public landing page has no auth wall — anonymous visitors must be able to
-- read published testimonials, not just logged-in users.
CREATE POLICY "Anyone reads published testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );
