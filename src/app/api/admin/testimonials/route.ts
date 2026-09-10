import { NextResponse } from "next/server";
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

// Testimonials are only ever created by a student (their dashboard) or an
// anonymous visitor (the public landing page form) — admins moderate what
// comes in rather than authoring content themselves, so there is no POST
// here anymore. See src/app/api/student/testimonials/route.ts and
// src/app/api/testimonials/submit/route.ts for the two submission paths.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  // Ordering alphabetically by status would put "approved" before "pending" —
  // the admin page groups these into "En attente" / "Traités" sections itself,
  // so this just needs a sensible default order within each group.
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id, name, role_text, rating, content, avatar_path, status, display_order, user_id, created_at, reviewed_by, reviewed_at"
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
