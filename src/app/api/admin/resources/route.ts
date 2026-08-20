import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const RESOURCES_BUCKET = "resources";

const SignUploadSchema = z.object({
  filename: z.string().min(1).max(200),
});

const ConfirmSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(2000).optional(),
  storage_path: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[a-zA-Z0-9/_.-]+\.pdf$/i, { message: "Invalid storage path." }),
  file_size: z.number().int().min(0).optional(),
});

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

/** Lazily provision the private bucket, mirroring the oral-recordings route. */
async function ensureBucket(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.storage.getBucket(RESOURCES_BUCKET);
  if (existing) return;
  await admin.storage.createBucket(RESOURCES_BUCKET, { public: false });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { data, error } = await supabase
    .from("resources")
    .select("id, title, description, storage_path, file_size, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * Step 1 of upload: hand back a signed URL so the browser sends the file straight
 * to storage. Routing a PDF through this serverless function would risk the
 * platform's request body limit on larger books.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const body: unknown = await request.json();
  const parsed = SignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    await ensureBucket();
  } catch (err) {
    console.error("[resources] bucket ensure failed:", err);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safeName}`.replace(/\.pdf$/i, "") + ".pdf";

  const admin = createSupabaseAdminClient();
  const { data: signed, error } = await admin.storage
    .from(RESOURCES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !signed) {
    console.error("[resources] createSignedUploadUrl failed:", error);
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  return NextResponse.json({ token: signed.token, path: signed.path });
}

/** Step 2: the bytes are in storage, so record the catalogue entry. */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const body: unknown = await request.json();
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({ ...parsed.data, created_by: auth.user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
