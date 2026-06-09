import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listExams, createExam } from "@/lib/admin/queries";
import { ExamSearchParamsSchema, CreateExamSchema } from "@/lib/schemas-admin";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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

  return { user, role: profile.role as string };
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = ExamSearchParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await listExams(supabase, parsed.data);
  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const body: unknown = await request.json();
  const parsed = CreateExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const exam = await createExam(supabase, parsed.data);
    revalidatePath("/dashboard/exams");
    revalidatePath("/admin/exams");
    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
