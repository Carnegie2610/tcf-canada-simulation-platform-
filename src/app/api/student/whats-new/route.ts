import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Marks the current announcement as acknowledged for the signed-in student.
 *
 * Deliberately narrow: students have no self-update policy on `profiles` (see
 * 20240029000000_fix_profiles_update_rls.sql — a blanket one previously allowed
 * quota/role tampering), so this runs through the service-role client but writes
 * exactly one column, always scoped to the caller's own row. Nothing about the
 * request body can influence which row or which field is touched.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ whats_new_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[whats-new] failed to mark as seen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
