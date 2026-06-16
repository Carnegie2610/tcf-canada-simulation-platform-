import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCombinationResultDetail } from "@/lib/student/queries";
import { CombinationResultView } from "@/components/organisms/student/CombinationResultView";
import type { CombinationTaskEval } from "@/lib/schemas";

interface Props {
  params: Promise<{ submissionId: string }>;
}

export default async function CombinationResultPage({ params }: Props) {
  const { submissionId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [result, profileResult] = await Promise.all([
    getCombinationResultDetail(supabase, submissionId, user.id),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
  ]);

  if (!result) notFound();

  if (!result.evaluation) {
    redirect("/dashboard/combinations");
  }

  const ev = result.evaluation;
  const profile = profileResult.data;
  const studentName = profile?.full_name ?? profile?.email ?? "";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CombinationResultView
        combinationTitle={result.combination.title}
        examType={result.combination.exam_type}
        globalScore={ev.global_score}
        cefrLevel={ev.cefr_level}
        appreciation={ev.appreciation}
        task1={ev.task_1_evaluation as unknown as CombinationTaskEval}
        task2={ev.task_2_evaluation as unknown as CombinationTaskEval}
        task3={ev.task_3_evaluation as unknown as CombinationTaskEval}
        createdAt={ev.created_at}
        combination={result.combination}
        studentName={studentName}
      />
    </div>
  );
}
