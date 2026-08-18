import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOralResultDetail } from "@/lib/student/queries";
import { OralResultView } from "@/components/organisms/student/OralResultView";
import type { OralTaskEval } from "@/lib/schemas";

interface Props {
  params: Promise<{ submissionId: string }>;
}

export default async function OralResultPage({ params }: Props) {
  const { submissionId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [result, profileResult] = await Promise.all([
    getOralResultDetail(supabase, submissionId, user.id),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
  ]);

  if (!result) notFound();

  if (!result.evaluation) {
    redirect(`/dashboard/expression-orale/attempt/${result.combination.id}/pending?sid=${submissionId}`);
  }

  const ev = result.evaluation;
  const tasks = result.combination.tasks;
  const profile = profileResult.data;
  const studentName = profile?.full_name ?? profile?.email ?? "";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <OralResultView
        oralCombinationTitle={result.combination.title}
        examType={result.combination.exam_type}
        globalScore={ev.global_score}
        cefrLevel={ev.cefr_level}
        appreciation={ev.appreciation}
        task1={ev.task_1_evaluation as unknown as OralTaskEval}
        task2={ev.task_2_evaluation as unknown as OralTaskEval}
        task3={ev.task_3_evaluation as unknown as OralTaskEval}
        speakingDurationSeconds1={tasks.tache_1.speakingTimeSeconds}
        speakingDurationSeconds2={tasks.tache_2.speakingTimeSeconds}
        speakingDurationSeconds3={tasks.tache_3.speakingTimeSeconds}
        createdAt={ev.created_at}
        combination={result.combination}
        studentName={studentName}
      />
    </div>
  );
}
