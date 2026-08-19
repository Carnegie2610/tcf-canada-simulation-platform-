-- Tracks when a student last dismissed the "Nouveautés" (what's new) modal.
--
-- Stored as a timestamp rather than a boolean so future announcements only need
-- the WHATS_NEW_RELEASED_AT constant in src/lib/whats-new.ts bumped: anyone whose
-- whats_new_seen_at predates that release (or is NULL) sees the modal again.

ALTER TABLE public.profiles
  ADD COLUMN whats_new_seen_at TIMESTAMPTZ;
