import { AdminShell } from "@/components/organisms/admin/AdminShell";
import type { UserRole } from "@/lib/admin/types";

interface AdminPageTemplateProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
  openTicketCount?: number;
}

export function AdminPageTemplate({
  children,
  currentUserName,
  currentUserRole,
  openTicketCount = 0,
}: AdminPageTemplateProps) {
  return (
    <AdminShell
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
      openTicketCount={openTicketCount}
    >
      {children}
    </AdminShell>
  );
}
