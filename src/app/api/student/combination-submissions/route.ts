import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const StartCombinationSchema = z.object({
  combinationId: z.string().uuid(),
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
  const parsed = StartCombinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { combinationId } = parsed.data;

  // Return existing submission if one already exists (resume flow)
  const { data: existing } = await supabase
    .from("combination_submissions")
    .select("id, is_completed")
    .eq("user_id", user.id)
    .eq("combination_id", combinationId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ submissionId: existing.id, resumed: true });
  }

  // Consume quota atomically — same as regular submissions
  const { data: quotaOk, error: rpcError } = await supabase.rpc(
    "verify_and_consume_quota",
    { p_user_id: user.id }
  );

  if (rpcError || !quotaOk) {
    return NextResponse.json({ error: "quota_exceeded" }, { status: 403 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("combination_submissions")
    .insert({
      user_id: user.id,
      combination_id: combinationId,
      draft_task_1: "",
      draft_task_2: "",
      draft_task_3: "",
      word_count_1: 0,
      word_count_2: 0,
      word_count_3: 0,
      is_completed: false,
    })
    .select("id")
    .single();

  if (insertError || !submission) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  revalidatePath("/dashboard/combinations");
  return NextResponse.json({ submissionId: submission.id, resumed: false });
}
