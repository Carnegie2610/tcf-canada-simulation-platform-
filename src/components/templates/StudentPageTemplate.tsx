import { StudentTopHeader } from "@/components/molecules/student/StudentTopHeader";
import type { StudentNotification } from "@/lib/student/notifications";

interface StudentPageTemplateProps {
  children: React.ReactNode;
  userId: string;
  currentUserName: string;
  notifications: StudentNotification[];
  unreadCount: number;
  eeUsed: number;
  eeTotal: number;
  eoUsed: number;
  eoTotal: number;
  expiresAt: string;
}

export function StudentPageTemplate({
  children,
  userId,
  currentUserName,
  notifications,
  unreadCount,
  eeUsed,
  eeTotal,
  eoUsed,
  eoTotal,
  expiresAt,
}: StudentPageTemplateProps) {
  return (
    <div className="min-h-screen bg-[var(--slate-950)]">
      <StudentTopHeader
        userId={userId}
        currentUserName={currentUserName}
        notifications={notifications}
        unreadCount={unreadCount}
        eeUsed={eeUsed}
        eeTotal={eeTotal}
        eoUsed={eoUsed}
        eoTotal={eoTotal}
        expiresAt={expiresAt}
      />
      <main className="pt-14">{children}</main>
    </div>
  );
}
