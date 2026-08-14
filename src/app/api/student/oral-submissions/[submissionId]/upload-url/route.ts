import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ORAL_RECORDINGS_BUCKET = "oral-recordings";

const SUPPORTED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4"] as const;

const RequestUploadUrlSchema = z.object({
  taskNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mimeType: z.enum(SUPPORTED_MIME_TYPES),
});

const ConfirmUploadSchema = z.object({
  taskNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  path: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[a-zA-Z0-9/_-]+\.(webm|m4a|mp4)$/, { message: "Invalid storage path format." }),
});

function extFromMimeType(mimeType: string): string {
  if (mimeType.startsWith("audio/webm")) return "webm";
  return "m4a";
}

const AUDIO_PATH_COLUMN: Record<1 | 2 | 3, "audio_path_task_1" | "audio_path_task_2" | "audio_path_task_3"> = {
  1: "audio_path_task_1",
  2: "audio_path_task_2",
  3: "audio_path_task_3",
};

/**
 * Idempotently makes sure the private "oral-recordings" bucket exists. This
 * repo has no bucket-provisioning migration/script convention yet, so this
 * lazily creates the bucket on first use rather than assuming it is already
 * there. In a fully hardened setup this should instead be provisioned once
 * via the Supabase dashboard or a dedicated setup script.
 */
async function ensureOralRecordingsBucket(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.storage.getBucket(ORAL_RECORDINGS_BUCKET);
  if (existing) return;

  await admin.storage.createBucket(ORAL_RECORDINGS_BUCKET, {
    public: false,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const body: unknown = await request.json();
  const parsed = RequestUploadUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { taskNumber, mimeType } = parsed.data;

  // Ownership guard — mirrors the pattern in
  // combination-submissions/[submissionId]/evaluate/route.ts.
  const { data: submission } = await supabase
    .from("oral_submissions")
    .select("id, is_completed")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (submission.is_completed) {
    return NextResponse.json({ error: "submission_already_completed" }, { status: 400 });
  }

  try {
    await ensureOralRecordingsBucket();
  } catch (err) {
    console.error("[oral-upload-url] bucket ensure failed:", err);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const ext = extFromMimeType(mimeType);
  const path = `${user.id}/${submissionId}/task-${taskNumber}.${ext}`;

  const admin = createSupabaseAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(ORAL_RECORDINGS_BUCKET)
    .createSignedUploadUrl(path);

  if (signError || !signed) {
    console.error("[oral-upload-url] createSignedUploadUrl failed:", signError);
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    token: signed.token,
    path: signed.path,
  });
}

/**
 * Confirmation step: called by the client once the PUT/upload to the signed
 * URL has actually succeeded, to persist the storage path onto the
 * submission row. Chosen over trying to verify the upload server-side from
 * the POST above, since createSignedUploadUrl issues the URL before the
 * bytes exist — there is nothing to confirm synchronously at signing time.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const body: unknown = await request.json();
  const parsed = ConfirmUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { taskNumber, path } = parsed.data;
  const column = AUDIO_PATH_COLUMN[taskNumber];

  // Defence in depth: the path must live under this user's own submission folder.
  if (!path.startsWith(`${user.id}/${submissionId}/`)) {
    return NextResponse.json({ error: "path_mismatch" }, { status: 400 });
  }

  const { error } = await supabase
    .from("oral_submissions")
    .update({ [column]: path })
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("is_completed", false);

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
