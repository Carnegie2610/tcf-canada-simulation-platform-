import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmissionDetailView } from "@/components/organisms/student/SubmissionDetailView";
import { getSubmissionDetail } from "@/lib/student/queries";

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
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/history"
          className="text-xs font-medium text-[var(--slate-500)] hover:text-[var(--slate-300)] transition-colors"
        >
          ← Retour à l&apos;historique
        </Link>
      </div>
      <SubmissionDetailView submission={submission} />
    </div>
  );
}
