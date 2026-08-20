-- Admin-managed announcement categories, replacing the hardcoded list.
--
-- The chosen icon is copied onto each announcement at creation time (announcements.icon),
-- so deleting a type never rewrites or blanks announcements already published with it —
-- it only removes it from future choices.

CREATE TABLE public.announcement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.announcement_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read announcement types"
  ON public.announcement_types FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage announcement types"
  ON public.announcement_types FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Seed with the set that was previously hardcoded, so nothing is lost on upgrade.
INSERT INTO public.announcement_types (label, icon) VALUES
  ('Annonce', '📢'),
  ('Important', '⚠️'),
  ('Date / session', '📅'),
  ('Bonne nouvelle', '🎉'),
  ('Examen', '📝'),
  ('Conseil', '🎓'),
  ('Astuce', '💡'),
  ('Maintenance', '🔧');
