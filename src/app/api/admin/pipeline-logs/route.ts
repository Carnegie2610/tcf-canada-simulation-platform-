import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

const EXAM_TYPES = ["EE", "EE_combination", "EO"] as const;

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const examTypeParam = request.nextUrl.searchParams.get("examType");
  const examType = EXAM_TYPES.find((t) => t === examTypeParam) ?? null;

  let query = supabase
    .from("pipeline_error_logs")
    .select(
      "id, submission_id, user_id, exam_type, stage, provider, error_message, created_at, profile:profiles(full_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (examType) {
    query = query.eq("exam_type", examType);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
