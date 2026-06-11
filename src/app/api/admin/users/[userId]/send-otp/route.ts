import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return auth.error;

  const { userId } = await params;

  const { data: target, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (profileError || !target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(target.email as string);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { sent: true } });
}
