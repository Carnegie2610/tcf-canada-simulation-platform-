import { AdminShell } from "@/components/organisms/admin/AdminShell";
import type { UserRole } from "@/lib/admin/types";

interface AdminPageTemplateProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
}

export function AdminPageTemplate({
  children,
  currentUserName,
  currentUserRole,
}: AdminPageTemplateProps) {
  return (
    <AdminShell currentUserName={currentUserName} currentUserRole={currentUserRole}>
      {children}
    </AdminShell>
  );
}
