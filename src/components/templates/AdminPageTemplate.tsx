import { AdminShell } from "@/components/organisms/admin/AdminShell";
import type { UserRole } from "@/lib/admin/types";

interface AdminPageTemplateProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
  openTicketCount?: number;
  pendingSignupCount?: number;
}

export function AdminPageTemplate({
  children,
  currentUserName,
  currentUserRole,
  openTicketCount = 0,
  pendingSignupCount = 0,
}: AdminPageTemplateProps) {
  return (
    <AdminShell
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
      openTicketCount={openTicketCount}
      pendingSignupCount={pendingSignupCount}
    >
      {children}
    </AdminShell>
  );
}
