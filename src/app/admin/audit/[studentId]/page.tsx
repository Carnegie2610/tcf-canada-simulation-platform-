import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentAuditData, getCombinationActivityDays } from "@/lib/admin/queries";
import { StudentAuditPanel } from "@/components/organisms/admin/StudentAuditPanel";
import { BackButton } from "@/components/atoms/BackButton";

export default async function StudentAuditPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId)) notFound();

  const supabase = await createSupabaseServerClient();

  const [auditData, activityResult] = await Promise.all([
    getStudentAuditData(supabase, studentId),
    getCombinationActivityDays(supabase, studentId),
  ]);

  if (!auditData) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton href="/admin" label="Retour au Tableau de bord" />
      </div>

      <StudentAuditPanel
        auditData={auditData}
        activityDays={activityResult.activityDays}
        currentStreak={activityResult.streak}
        totalCompleted={activityResult.totalCompleted}
      />
    </div>
  );
}
