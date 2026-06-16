"use client";

import { useState } from "react";
import { CombinationCard } from "@/components/molecules/student/CombinationCard";
import { QuotaStatusBar } from "@/components/molecules/student/QuotaStatusBar";
import { PaginationBar } from "@/components/atoms/PaginationBar";
import type { CombinationWithSubmission } from "@/lib/student/queries";

const PAGE_SIZE = 30;

interface CombinationGridProps {
  combinationsWithStatus: CombinationWithSubmission[];
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

export function CombinationGrid({
  combinationsWithStatus,
  simulationsUsed,
  simulationsTotal,
  expiresAt,
}: CombinationGridProps) {
  const [page, setPage] = useState(1);

  const isExpired = new Date(expiresAt) < new Date();
  const quotaExceeded = isExpired || simulationsUsed >= simulationsTotal;

  // Only show unattempted + in-progress combinations; completed ones live in Historique & Progrès
  const active = combinationsWithStatus.filter(
    ({ submission }) => submission?.is_completed !== true
  );

  const paginated = active.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const tcf = paginated.filter((c) => c.combination.exam_type === "TCF");
  const tef = paginated.filter((c) => c.combination.exam_type === "TEF");

  function renderGroup(items: CombinationWithSubmission[]) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ combination, submission }) => (
          <CombinationCard
            key={combination.id}
            combination={combination}
            submission={submission}
            quotaExceeded={quotaExceeded}
            expiresAt={expiresAt}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuotaStatusBar
        used={simulationsUsed}
        total={simulationsTotal}
        expiresAt={expiresAt}
      />

      {tcf.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            TCF Canada
          </h2>
          {renderGroup(tcf)}
        </section>
      )}

      {tef.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            TEF Canada
          </h2>
          {renderGroup(tef)}
        </section>
      )}

      {active.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
          <p className="text-sm text-[var(--slate-500)]">
            Toutes vos simulations sont complètes. Consultez votre Historique &amp; Progrès.
          </p>
        </div>
      )}

      <PaginationBar
        total={active.length}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
