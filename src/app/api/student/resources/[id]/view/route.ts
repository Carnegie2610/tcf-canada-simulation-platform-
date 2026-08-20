import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RESOURCES_BUCKET = "resources";
/** Short-lived on purpose: long enough to open and read, too short to pass around. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Issues a temporary URL for one PDF. The bucket is private, so this route is the
 * only way to reach a file — a student who knows a storage path still can't fetch
 * it directly, and the URL they do get expires.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
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
    .createSignedUrl(resource.storage_path as string, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) {
    console.error("[resources] signed view URL failed:", error);
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, title: resource.title });
}
