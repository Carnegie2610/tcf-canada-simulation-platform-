import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ORAL_RECORDINGS_BUCKET = "oral-recordings";
const SIGNED_URL_TTL_SECONDS = 300; // playback-only, short-lived

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { submissionId } = await params;
  if (!z.string().uuid().safeParse(submissionId).success) {
    return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Server-verified paths — never trust paths supplied by the client.
  const { data: submission } = await admin
    .from("oral_submissions")
    .select("audio_path_task_1, audio_path_task_2, audio_path_task_3")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paths: Record<"task1" | "task2" | "task3", string | null> = {
    task1: submission.audio_path_task_1,
    task2: submission.audio_path_task_2,
    task3: submission.audio_path_task_3,
  };

  const urls: Record<"task1" | "task2" | "task3", string | null> = {
    task1: null,
    task2: null,
    task3: null,
  };

  for (const key of ["task1", "task2", "task3"] as const) {
    const path = paths[key];
    if (!path) continue;

    const { data: signed } = await admin.storage
      .from(ORAL_RECORDINGS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    urls[key] = signed?.signedUrl ?? null;
  }

  return NextResponse.json(urls);
}
