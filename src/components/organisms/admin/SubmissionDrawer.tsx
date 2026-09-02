"use client";

import { DiagnosticTabView } from "@/components/molecules/admin/DiagnosticTabView";
import { OralSubmissionReviewPanel } from "@/components/molecules/admin/OralSubmissionReviewPanel";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";
import { AdminPdfDownloadButton } from "@/components/molecules/admin/AdminPdfDownloadButton";

interface SubmissionDrawerProps {
  submission: SubmissionWithEvaluation | null;
  aiEnabled: boolean;
  onClose: () => void;
}

export function SubmissionDrawer({ submission, aiEnabled, onClose }: SubmissionDrawerProps) {
  if (!submission) return null;

  const isEmpty = !submission.user_draft || submission.user_draft.trim() === "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-[var(--slate-700)] bg-[var(--slate-950)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--slate-800)] px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-[var(--brand-white)]">
                {submission.exam?.title ?? "Examen inconnu"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs text-[var(--slate-400)]">
                  {submission.exam?.section?.replace("_", " ")}
                </span>
                <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs text-[var(--slate-400)]">
                  {submission.exam?.exam_type}
                </span>
                {!submission.is_completed && (
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                    En cours
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <AdminPdfDownloadButton submission={submission} />
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        {submission.sourceType === "oral" && submission.oralTasks ? (
          <OralSubmissionReviewPanel
            submissionId={submission.id}
            oralTasks={submission.oralTasks}
          />
        ) : (
          <div className="flex flex-1 divide-x divide-[var(--slate-800)] overflow-hidden">
            {/* Left: Prompt */}
            <div className="flex w-1/2 flex-col overflow-hidden">
              <div className="border-b border-[var(--slate-800)] px-5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--slate-500)]">
                  Sujet original
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-sm leading-relaxed text-[var(--slate-300)] whitespace-pre-wrap">
                  {submission.exam?.title
                    ? "Voir le sujet ci-dessous dans le champ de simulation."
                    : "Sujet non disponible."}
                </p>
              </div>
            </div>

            {/* Right: Student draft */}
            <div className="flex w-1/2 flex-col overflow-hidden">
              <div className="border-b border-[var(--slate-800)] px-5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--slate-500)]">
                  Brouillon étudiant
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {isEmpty ? (
                  <p className="text-sm text-[var(--slate-500)] italic">
                    Brouillon vide soumis.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-[var(--slate-300)] whitespace-pre-wrap">
                    {submission.user_draft}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic tabs */}
        <div className="border-t border-[var(--slate-800)] px-6 py-4 max-h-72 overflow-y-auto">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--slate-500)]">
            Évaluation diagnostique
          </p>
          <DiagnosticTabView evaluation={submission.evaluation} aiEnabled={aiEnabled} />
        </div>
      </div>
    </>
  );
}
