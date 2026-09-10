import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TESTIMONIAL_AVATARS_BUCKET } from "@/lib/constants/storage";

const SignUploadSchema = z.object({
  filename: z.string().min(1).max(200),
});

const IMAGE_EXT_REGEX = /^[a-zA-Z0-9/_.-]+\.(png|jpe?g|webp|gif)$/i;

/** Same bucket as the admin upload route, but open to any authenticated
 * student — not just admins — since this is for their own submission. */
async function requireAuthenticated(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}

async function ensureBucket(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.storage.getBucket(TESTIMONIAL_AVATARS_BUCKET);
  if (existing) return;
  await admin.storage.createBucket(TESTIMONIAL_AVATARS_BUCKET, { public: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAuthenticated(supabase);
  if (auth.error) return auth.error;

  const body: unknown = await request.json();
  const parsed = SignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!IMAGE_EXT_REGEX.test(parsed.data.filename)) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }

  try {
    await ensureBucket();
  } catch (err) {
    console.error("[testimonial-avatars] bucket ensure failed:", err);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const ext = parsed.data.filename.split(".").pop();
  const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safeName}`.replace(new RegExp(`\\.${ext}$`, "i"), "") + `.${ext}`;

  const admin = createSupabaseAdminClient();
  const { data: signed, error } = await admin.storage
    .from(TESTIMONIAL_AVATARS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !signed) {
    console.error("[testimonial-avatars] createSignedUploadUrl failed:", error);
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage
    .from(TESTIMONIAL_AVATARS_BUCKET)
    .getPublicUrl(signed.path);

  return NextResponse.json({
    token: signed.token,
    path: signed.path,
    publicUrl: publicUrlData.publicUrl,
  });
}
