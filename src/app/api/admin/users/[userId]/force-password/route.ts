import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ForcePasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden — super_admin only" }, { status: 403 }) };
  }

  return { user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return auth.error;

  const { userId } = await params;

  const body: unknown = await request.json();
  const parsed = ForcePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return NextResponse.json({ error: msgs[0] ?? "Validation échouée" }, { status: 400 });
  }

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { updated: true } });
}
