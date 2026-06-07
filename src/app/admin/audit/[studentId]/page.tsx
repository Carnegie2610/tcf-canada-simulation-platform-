import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentAuditData } from "@/lib/admin/queries";
import { StudentAuditPanel } from "@/components/organisms/admin/StudentAuditPanel";

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
  const auditData = await getStudentAuditData(supabase, studentId);

  if (!auditData) notFound();

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--slate-500)]">
        <Link href="/admin/audit" className="hover:text-[var(--brand-white)] transition-colors">
          Auditor
        </Link>
        <span>/</span>
        <span className="text-[var(--slate-300)]">{auditData.profile.full_name}</span>
      </nav>

      <StudentAuditPanel auditData={auditData} />
    </div>
  );
}
