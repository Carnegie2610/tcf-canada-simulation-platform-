import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MarkReadSchema = z.object({
  items: z
    .array(
      z.object({
        source: z.enum(["announcement", "ticket_message"]),
        id: z.string().uuid(),
      })
    )
    .min(1)
    .max(50),
});

/**
 * Marks notifications as read for the signed-in student. Runs on the caller's own
 * client (not service-role): `notification_reads` policies pin both reads and
 * writes to auth.uid(), so a student cannot mark anything on someone else's behalf
 * even by forging the body.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = MarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const rows = parsed.data.items.map((i) => ({
    user_id: user.id,
    source_type: i.source,
    source_id: i.id,
  }));

  // Re-reading an already-read notification is normal, so a duplicate is a no-op
  // rather than an error.
  const { error } = await supabase
    .from("notification_reads")
    .upsert(rows, { onConflict: "user_id,source_type,source_id", ignoreDuplicates: true });

  if (error) {
    console.error("[notifications] mark-read failed:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
