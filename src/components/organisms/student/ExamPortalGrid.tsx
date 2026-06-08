import { ExamCard } from "@/components/molecules/student/ExamCard";
import { QuotaStatusBar } from "@/components/molecules/student/QuotaStatusBar";
import type { ExamWithSubmission } from "@/lib/student/queries";

interface ExamPortalGridProps {
  examsWithStatus: ExamWithSubmission[];
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

export function ExamPortalGrid({
  examsWithStatus,
  simulationsUsed,
  simulationsTotal,
  expiresAt,
}: ExamPortalGridProps) {
  const isExpired = new Date(expiresAt) < new Date();
  const quotaExceeded = isExpired || simulationsUsed >= simulationsTotal;

  const sectionA = examsWithStatus.filter((e) => e.exam.section === "SECTION_A");
  const sectionB = examsWithStatus.filter((e) => e.exam.section === "SECTION_B");

  return (
    <div className="space-y-6">
      <QuotaStatusBar
        used={simulationsUsed}
        total={simulationsTotal}
        expiresAt={expiresAt}
      />

      {sectionA.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Section A — Expression guidée
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionA.map(({ exam, submission }) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                submission={submission}
                quotaExceeded={quotaExceeded}
              />
            ))}
          </div>
        </section>
      )}

      {sectionB.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Section B — Expression libre
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionB.map(({ exam, submission }) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                submission={submission}
                quotaExceeded={quotaExceeded}
              />
            ))}
          </div>
        </section>
      )}

      {examsWithStatus.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
          <p className="text-sm text-[var(--slate-500)]">
            Aucun sujet disponible pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}
