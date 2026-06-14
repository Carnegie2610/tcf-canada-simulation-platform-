import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CombinationEditor } from "@/components/organisms/student/CombinationEditor";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

interface ArenaPageProps {
  params: Promise<{ combinationId: string }>;
  searchParams: Promise<{ sid?: string }>;
}

export default async function ArenaPage({
  params,
  searchParams,
}: ArenaPageProps) {
  const { combinationId } = await params;
  const { sid } = await searchParams;

  if (!sid) redirect("/dashboard/combinations");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: combination } = await supabase
    .from("combinations")
    .select("*")
    .eq("id", combinationId)
    .single();

  if (!combination) notFound();

  const { data: submission } = await supabase
    .from("combination_submissions")
    .select("*")
    .eq("id", sid)
    .eq("user_id", user.id)
    .single();

  if (!submission) redirect("/dashboard/combinations");

  if ((submission as CombinationSubmission).is_completed) {
    redirect("/dashboard/combinations");
  }

  const sub = submission as CombinationSubmission;

  return (
    <CombinationEditor
      combination={combination as Combination}
      submissionId={sub.id}
      initialDrafts={[sub.draft_task_1, sub.draft_task_2, sub.draft_task_3]}
      initialWordCounts={[sub.word_count_1, sub.word_count_2, sub.word_count_3]}
    />
  );
}
