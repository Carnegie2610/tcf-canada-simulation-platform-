"use client";

import { useState } from "react";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";

/**
 * Downloads the same report the student gets, generated from the original
 * evaluation rather than the audit view's normalised copy (which is lossy).
 *
 * The PDF renderer is imported dynamically, exactly as the student pages do —
 * it's a heavy dependency and must stay out of the admin bundle.
 */
export function AdminPdfDownloadButton({
  submission,
}: {
  submission: SubmissionWithEvaluation;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = submission.sourceType;
  // Only combination and oral results have a PDF report; legacy single-exam
  // submissions were never given one.
  if (type !== "combination" && type !== "oral") return null;
  if (!submission.evaluation) return null;

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/submissions/${submission.id}/pdf-data?type=${type}`
      );
      if (!res.ok) throw new Error("fetch_failed");
      const data = await res.json();

      const { pdf } = await import("@react-pdf/renderer");

      let blob: Blob;
      let filename: string;

      if (data.kind === "combination") {
        const { CombinationPdfDocument } = await import(
          "@/components/organisms/student/pdf/CombinationPdfDocument"
        );
        blob = await pdf(
          <CombinationPdfDocument
            combinationTitle={data.combinationTitle}
            examType={data.examType}
            globalScore={data.globalScore}
            cefrLevel={data.cefrLevel}
            appreciation={data.appreciation}
            task1={data.task1}
            task2={data.task2}
            task3={data.task3}
            wordCount1={data.wordCount1}
            wordCount2={data.wordCount2}
            wordCount3={data.wordCount3}
            createdAt={data.createdAt}
            studentName={data.studentName}
          />
        ).toBlob();
        filename = `${data.studentName || "etudiant"}_${data.combinationTitle}`;
      } else {
        const { OralPdfDocument } = await import(
          "@/components/organisms/student/pdf/OralPdfDocument"
        );
        blob = await pdf(
          <OralPdfDocument
            oralCombinationTitle={data.oralCombinationTitle}
            examType={data.examType}
            globalScore={data.globalScore}
            cefrLevel={data.cefrLevel}
            appreciation={data.appreciation}
            task1={data.task1}
            task2={data.task2}
            task3={data.task3}
            speakingDurationSeconds1={data.speakingDurationSeconds1}
            speakingDurationSeconds2={data.speakingDurationSeconds2}
            speakingDurationSeconds3={data.speakingDurationSeconds3}
            createdAt={data.createdAt}
            studentName={data.studentName}
          />
        ).toBlob();
        filename = `${data.studentName || "etudiant"}_${data.oralCombinationTitle}_oral`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Échec de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1.5 text-xs font-medium text-[var(--slate-200)] transition-colors hover:bg-[var(--slate-700)] disabled:opacity-50"
      >
        {loading ? "Génération…" : "📥 PDF"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
