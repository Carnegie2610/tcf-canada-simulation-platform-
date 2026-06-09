import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const StartSubmissionSchema = z.object({
  examId: z.string().uuid(),
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
  const parsed = StartSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { examId } = parsed.data;

  // Check for existing submission for this exam
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, is_completed")
    .eq("user_id", user.id)
    .eq("exam_id", examId)
    .maybeSingle();

  if (existing) {
    // Return existing submission (resume)
    return NextResponse.json({ submissionId: existing.id, resumed: true });
  }

  // Consume quota atomically
  const { data: quotaOk, error: rpcError } = await supabase.rpc(
    "verify_and_consume_quota",
    { p_user_id: user.id }
  );

  if (rpcError || !quotaOk) {
    return NextResponse.json({ error: "quota_exceeded" }, { status: 403 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      exam_id: examId,
      user_draft: "",
      word_count: 0,
      is_completed: false,
    })
    .select("id")
    .single();

  if (insertError || !submission) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  revalidatePath("/dashboard/exams");
  return NextResponse.json({ submissionId: submission.id, resumed: false });
}
