import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Records that the announcement modal was shown to the signed-in student once
 * more. Called on display (not on dismissal) so the "appears on N logins" budget
 * is spent whether or not the student reads it — closing the tab doesn't grant
 * unlimited replays.
 *
 * Deliberately narrow: students have no self-update policy on `profiles` (see
 * 20240029000000_fix_profiles_update_rls.sql — a blanket one previously allowed
 * quota/role tampering), so this runs through the service-role client but writes
 * exactly one column, always scoped to the caller's own row. Nothing in the
 * request can influence which row or which field is touched.
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

  const { data: current, error: readError } = await admin
    .from("profiles")
    .select("whats_new_seen_count")
    .eq("id", user.id)
    .single();

  if (readError || !current) {
    console.error("[whats-new] failed to read current count:", readError);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  // Read-then-write rather than an atomic SQL increment: the only contention
  // would be one student opening two tabs at the same instant, where the worst
  // case is a single view counting once instead of twice.
  const { error: writeError } = await admin
    .from("profiles")
    .update({ whats_new_seen_count: (current.whats_new_seen_count ?? 0) + 1 })
    .eq("id", user.id);

  if (writeError) {
    console.error("[whats-new] failed to record view:", writeError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
