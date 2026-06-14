import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PatchCombinationSchema = z.object({
  draft_task_1: z.string().optional(),
  draft_task_2: z.string().optional(),
  draft_task_3: z.string().optional(),
  word_count_1: z.number().int().min(0).optional(),
  word_count_2: z.number().int().min(0).optional(),
  word_count_3: z.number().int().min(0).optional(),
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
  const parsed = PatchCombinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("combination_submissions")
    .update(parsed.data)
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
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
    .delete()
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
