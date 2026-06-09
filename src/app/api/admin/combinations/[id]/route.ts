import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCombination, deleteCombination } from "@/lib/admin/queries";
import { UpdateCombinationSchema } from "@/lib/schemas-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid combination ID" }, { status: 400 });
  }

  const body: unknown = await request.json();
  const parsed = UpdateCombinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const combo = await updateCombination(supabase, id, parsed.data);
    revalidatePath("/dashboard/exams");
    revalidatePath("/admin/exams");
    return NextResponse.json({ data: combo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid combination ID" }, { status: 400 });
  }

  try {
    await deleteCombination(supabase, id);
    revalidatePath("/dashboard/exams");
    revalidatePath("/admin/exams");
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
