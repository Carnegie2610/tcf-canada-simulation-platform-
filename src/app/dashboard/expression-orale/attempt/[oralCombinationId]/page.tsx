import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OralAttemptFlow } from "@/components/organisms/student/oral/OralAttemptFlow";
import type { OralCombination } from "@/lib/admin/types";
import type { OralSubmission } from "@/lib/student/queries";

interface OralAttemptPageProps {
  params: Promise<{ oralCombinationId: string }>;
  searchParams: Promise<{ sid?: string }>;
}

export default async function OralAttemptPage({
  params,
  searchParams,
}: OralAttemptPageProps) {
  const { oralCombinationId } = await params;
  const { sid } = await searchParams;

  if (!sid) redirect("/dashboard/expression-orale");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: combination } = await supabase
    .from("oral_combinations")
    .select("*")
    .eq("id", oralCombinationId)
    .single();

  if (!combination) notFound();

  const { data: submission } = await supabase
    .from("oral_submissions")
    .select("*")
    .eq("id", sid)
    .eq("user_id", user.id)
    .single();

  if (!submission) redirect("/dashboard/expression-orale");

  const sub = submission as OralSubmission;

  if (sub.is_completed) {
    redirect(`/dashboard/expression-orale/attempt/${oralCombinationId}/pending?sid=${sid}`);
  }

  const combo = combination as OralCombination;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <OralAttemptFlow
        oralCombinationId={combo.id}
        submissionId={sub.id}
        tasks={combo.tasks}
        globalDurationMinutes={combo.global_duration}
      />
    </div>
  );
}
