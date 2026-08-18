import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const StartOralCombinationSchema = z.object({
  oralCombinationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = StartOralCombinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { oralCombinationId } = parsed.data;

  // Return existing submission if one already exists (resume flow)
  const { data: existing } = await supabase
    .from("oral_submissions")
    .select("id, is_completed")
    .eq("user_id", user.id)
    .eq("oral_combination_id", oralCombinationId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ submissionId: existing.id, resumed: true });
  }

  // Consume quota atomically — Expression Orale pool
  const { data: quotaOk, error: rpcError } = await supabase.rpc(
    "verify_and_consume_quota",
    { p_user_id: user.id, p_skill_type: "eo" }
  );

  if (rpcError || !quotaOk) {
    return NextResponse.json({ error: "quota_exceeded" }, { status: 403 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("oral_submissions")
    .insert({
      user_id: user.id,
      oral_combination_id: oralCombinationId,
      is_completed: false,
    })
    .select("id")
    .single();

  if (insertError || !submission) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  revalidatePath("/dashboard/expression-orale");
  return NextResponse.json({ submissionId: submission.id, resumed: false });
}
