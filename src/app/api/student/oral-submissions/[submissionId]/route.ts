import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Final submit step for an oral attempt: called either when the student
 * manually submits, or automatically when the global attempt timer runs out.
 * Partial submissions (fewer than 3 recorded tasks) are allowed on purpose —
 * a timed-out student should still be able to be scored on whatever they
 * managed to record, rather than being blocked entirely. Marks the submission
 * complete and hands off to the evaluation pipeline (pipeline_status stays
 * "pending" until the evaluate route picks it up).
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const { data: submission } = await supabase
    .from("oral_submissions")
    .select("is_completed")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (submission.is_completed) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const { error } = await supabase
    .from("oral_submissions")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      pipeline_status: "pending",
    })
    .eq("id", submissionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }

  revalidatePath("/dashboard/expression-orale");
  return NextResponse.json({ ok: true });
}
