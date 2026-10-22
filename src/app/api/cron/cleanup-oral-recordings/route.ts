import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const ORAL_RECORDINGS_BUCKET = "oral-recordings";
const RETENTION_DAYS = 3;
const BATCH_SIZE = 200;

interface SubmissionRow {
  id: string;
  audio_path_task_1: string | null;
  audio_path_task_2: string | null;
  audio_path_task_3: string | null;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const cutoffIso = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await admin
    .from("oral_submissions")
    .select("id, audio_path_task_1, audio_path_task_2, audio_path_task_3")
    .eq("pipeline_status", "completed")
    .is("audio_deleted_at", null)
    .lt("completed_at", cutoffIso)
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const submissions = (rows ?? []) as SubmissionRow[];
  const eligible = submissions.filter(
    (s) => s.audio_path_task_1 || s.audio_path_task_2 || s.audio_path_task_3,
  );

  if (eligible.length === 0) {
    return NextResponse.json({ deletedSubmissions: 0, deletedFiles: 0 });
  }

  const allPaths = eligible.flatMap((s) =>
    [s.audio_path_task_1, s.audio_path_task_2, s.audio_path_task_3].filter(
      (path): path is string => path !== null,
    ),
  );

  const { error: removeError } = await admin.storage
    .from(ORAL_RECORDINGS_BUCKET)
    .remove(allPaths);

  if (removeError) {
    return NextResponse.json({ error: "storage_delete_failed" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("oral_submissions")
    .update({
      audio_path_task_1: null,
      audio_path_task_2: null,
      audio_path_task_3: null,
      audio_deleted_at: now,
    })
    .in(
      "id",
      eligible.map((s) => s.id),
    );

  if (updateError) {
    return NextResponse.json({ error: "db_update_failed" }, { status: 500 });
  }

  return NextResponse.json({
    deletedSubmissions: eligible.length,
    deletedFiles: allPaths.length,
  });
}
