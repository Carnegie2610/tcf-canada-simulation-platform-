import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AutosaveSchema = z.object({
  userDraft: z.string().max(8000),
  wordCount: z.number().int().nonnegative(),
});

export async function PATCH(
  request: NextRequest,
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
  const body: unknown = await request.json();
  const parsed = AutosaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { userDraft, wordCount } = parsed.data;

  const { error } = await supabase
    .from("submissions")
    .update({ user_draft: userDraft, word_count: wordCount })
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
