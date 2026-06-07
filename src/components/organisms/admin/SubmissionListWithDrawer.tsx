"use client";

import { useState } from "react";
import { SubmissionListItem } from "@/components/molecules/admin/SubmissionListItem";
import { SubmissionDrawer } from "./SubmissionDrawer";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";

interface SubmissionListWithDrawerProps {
  submissions: SubmissionWithEvaluation[];
  aiEnabled: boolean;
}

export function SubmissionListWithDrawer({
  submissions,
  aiEnabled,
}: SubmissionListWithDrawerProps) {
  const [selected, setSelected] = useState<SubmissionWithEvaluation | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/30 py-12">
        <p className="text-sm text-[var(--slate-500)]">
          Aucune simulation effectuée par cet étudiant.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {submissions.map((s) => (
          <SubmissionListItem key={s.id} submission={s} onOpen={setSelected} />
        ))}
      </div>
      <SubmissionDrawer
        submission={selected}
        aiEnabled={aiEnabled}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
