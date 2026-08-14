-- ai_prompts.updated_by referenced auth.users(id) with no ON DELETE clause, which
-- defaults to blocking the delete entirely (surfaced by the Supabase Admin API as a
-- generic "Database error deleting user"). Editing a prompt shouldn't prevent that
-- staff account from ever being deleted later — just null out who last touched it,
-- matching the same pattern already used by support_tickets.user_id.

ALTER TABLE public.ai_prompts
  DROP CONSTRAINT IF EXISTS ai_prompts_updated_by_fkey;

ALTER TABLE public.ai_prompts
  ADD CONSTRAINT ai_prompts_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
