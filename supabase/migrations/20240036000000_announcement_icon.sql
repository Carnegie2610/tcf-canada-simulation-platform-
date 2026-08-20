-- Lets an admin pick the icon an announcement carries, so students can tell an
-- alert apart from a celebration at a glance in the notification list.
-- Nullable with a fallback in the app rather than a DB default, so existing rows
-- keep working untouched.

ALTER TABLE public.announcements
  ADD COLUMN icon VARCHAR(10);
