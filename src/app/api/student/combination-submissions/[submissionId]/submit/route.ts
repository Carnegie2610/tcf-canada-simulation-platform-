import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(
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

  const { error } = await supabase
    .from("combination_submissions")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }

  revalidatePath("/dashboard/combinations");
  return NextResponse.json({ ok: true });
}
