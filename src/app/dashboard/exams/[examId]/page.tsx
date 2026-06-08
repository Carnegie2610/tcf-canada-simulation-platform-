import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SimulationEditor } from "@/components/organisms/student/SimulationEditor";
import type { Exam } from "@/lib/admin/types";

interface ExamEditorPageProps {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ sid?: string }>;
}

export default async function ExamEditorPage({ params, searchParams }: ExamEditorPageProps) {
  const { examId } = await params;
  const { sid } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!sid) redirect(`/dashboard/exams`);

  // Fetch exam
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (examError || !exam) notFound();

  // Fetch submission — RLS ensures ownership
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id, user_draft, word_count, is_completed")
    .eq("id", sid)
    .eq("user_id", user.id)
    .single();

  if (subError || !submission) redirect("/dashboard/exams");

  // If already submitted, redirect to history
  if (submission.is_completed) {
    redirect(`/dashboard/history/${sid}`);
  }

  return (
    <SimulationEditor
      exam={exam as Exam}
      submissionId={submission.id}
      initialDraft={submission.user_draft ?? ""}
      initialWordCount={submission.word_count ?? 0}
    />
  );
}
