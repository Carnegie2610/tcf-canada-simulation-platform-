-- Counts how many separate sessions a student has been shown the "Nouveautés"
-- (what's new) modal. It appears on their first few logins rather than only once,
-- so a student who closes it without reading still gets another chance.
--
-- A counter rather than a boolean/timestamp: the display limit lives in
-- WHATS_NEW_MAX_VIEWS (src/lib/whats-new.ts) and can be tuned without a migration,
-- and a future announcement can reset the column to 0 to re-run the campaign.

ALTER TABLE public.profiles
  ADD COLUMN whats_new_seen_count INTEGER NOT NULL DEFAULT 0;
