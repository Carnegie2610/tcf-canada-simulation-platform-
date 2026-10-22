import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PipelineExamType = "EE" | "EE_combination" | "EO";

interface LogPipelineErrorInput {
  submissionId: string | null;
  userId: string | null;
  examType: PipelineExamType;
  stage: string;
  errorMessage: string;
  provider?: string | null;
}

// Persists a submission-pipeline failure so admins can inspect what actually
// broke for a given student, instead of relying on their vague description and
// digging through ephemeral Vercel function logs. Never throws — a logging
// failure must not break the evaluation response path.
export async function logPipelineError(input: LogPipelineErrorInput): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("pipeline_error_logs").insert({
      submission_id: input.submissionId,
      user_id: input.userId,
      exam_type: input.examType,
      stage: input.stage,
      provider: input.provider ?? null,
      error_message: input.errorMessage,
    });
  } catch (err) {
    console.error("[logPipelineError] failed to persist log:", err);
  }
}
