import { StudentTopHeader } from "@/components/molecules/student/StudentTopHeader";

interface StudentPageTemplateProps {
  children: React.ReactNode;
  userId: string;
  currentUserName: string;
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

export function StudentPageTemplate({
  children,
  userId,
  currentUserName,
  simulationsUsed,
  simulationsTotal,
  expiresAt,
}: StudentPageTemplateProps) {
  return (
    <div className="min-h-screen bg-[var(--slate-950)]">
      <StudentTopHeader
        userId={userId}
        currentUserName={currentUserName}
        simulationsUsed={simulationsUsed}
        simulationsTotal={simulationsTotal}
        expiresAt={expiresAt}
      />
      <main className="pt-14">{children}</main>
    </div>
  );
}
