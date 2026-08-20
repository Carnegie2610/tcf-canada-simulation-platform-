import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RESOURCES_BUCKET = "resources";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

/**
 * Signed URL so an admin can read back a document they published — same mechanism
 * students get, so the preview is exactly what they will see rather than an
 * approximation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path, title")
    .eq("id", id)
    .single();

  if (!resource) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data: signed, error } = await admin.storage
    .from(RESOURCES_BUCKET)
    .createSignedUrl(resource.storage_path as string, 60 * 60);

  if (error || !signed) {
    console.error("[resources] admin preview URL failed:", error);
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, title: resource.title });
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
    return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  }

  const { data: resource } = await supabase
    .from("resources").select("storage_path").eq("id", id).single();

  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Remove the file too, but only after the row is gone — an orphaned file is
  // harmless, whereas a row pointing at a deleted file breaks the student view.
  if (resource?.storage_path) {
    const admin = createSupabaseAdminClient();
    const { error: rmError } = await admin.storage
      .from(RESOURCES_BUCKET)
      .remove([resource.storage_path as string]);
    if (rmError) console.error("[resources] file cleanup failed:", rmError);
  }

  return new NextResponse(null, { status: 204 });
}
