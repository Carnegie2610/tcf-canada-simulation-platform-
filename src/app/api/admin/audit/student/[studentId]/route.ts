import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentAuditData } from "@/lib/admin/queries";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

  return { user, role: profile.role };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { studentId } = await params;
  const uuidResult = z.string().uuid().safeParse(studentId);
  if (!uuidResult.success) {
    return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 });
  }

  const auditData = await getStudentAuditData(supabase, studentId);
  if (!auditData) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ data: auditData });
}
