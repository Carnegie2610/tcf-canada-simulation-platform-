-- Admin-uploaded PDF study material, listed for students in "Ressources".
--
-- Only metadata lives here; the file itself sits in the private `resources`
-- storage bucket, reached through short-lived signed URLs generated server-side.
-- Same approach as oral-recordings: the bucket is never public, so a path alone
-- grants nobody access.

CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path VARCHAR(512) NOT NULL,
    file_size INTEGER,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Every signed-in user may see the catalogue; the file itself still requires a
-- signed URL, which is only ever issued by the server.
CREATE POLICY "Authenticated users read resources"
  ON public.resources FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );
