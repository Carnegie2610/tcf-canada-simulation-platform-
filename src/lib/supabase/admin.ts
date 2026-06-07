import { createClient } from "@supabase/supabase-js";

// Uses the SERVICE_ROLE_KEY — only import this in API route handlers.
// Never import in "use client" components.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
