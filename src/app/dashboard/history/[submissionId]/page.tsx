import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmissionDetailView } from "@/components/organisms/student/SubmissionDetailView";
import { getSubmissionDetail } from "@/lib/student/queries";
import { BackButton } from "@/components/atoms/BackButton";

interface SubmissionDetailPageProps {
  params: Promise<{ submissionId: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { submissionId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const submission = await getSubmissionDetail(supabase, submissionId);

  if (!submission) notFound();

  // RLS protects ownership, but double-check
  if (submission.user_id !== user.id) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard/history" label="Historique" />
      </div>
      <SubmissionDetailView submission={submission} />
    </div>
  );
}
