"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import type { Exam, SubmissionWithEvaluation } from "@/lib/admin/types";

interface ExamCardProps {
  exam: Exam;
  submission: SubmissionWithEvaluation | null;
  quotaExceeded: boolean;
}

const sectionLabel: Record<string, string> = {
  SECTION_A: "Section A",
  SECTION_B: "Section B",
};

export function ExamCard({ exam, submission, quotaExceeded }: ExamCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isCompleted = submission?.is_completed === true;
  const isInProgress = submission !== null && !isCompleted;
  const isLocked = quotaExceeded && !isInProgress && !isCompleted;

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examId: exam.id }),
      });
      const data = await res.json() as { submissionId?: string; error?: string };
      if (!res.ok || !data.submissionId) {
        alert("Quota épuisé ou erreur. Veuillez contacter le support.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/exams/${exam.id}?sid=${data.submissionId}`);
    } catch {
      setLoading(false);
    }
  }

  function handleResume() {
    router.push(`/dashboard/exams/${exam.id}?sid=${submission!.id}`);
  }

  function handleViewResult() {
    router.push(`/dashboard/history/${submission!.id}`);
  }

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-all ${
        isCompleted
          ? "border-[var(--slate-700)] bg-[var(--slate-900)]/60 opacity-70"
          : isLocked
            ? "border-[var(--slate-700)] bg-[var(--slate-900)]/40 opacity-60"
            : "border-[var(--slate-700)] bg-[var(--slate-900)] hover:border-[var(--slate-600)]"
      }`}
    >
      {/* Header badges */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex rounded bg-[var(--blue-600)]/20 px-2 py-0.5 text-xs font-medium text-[var(--blue-500)]">
          {exam.exam_type}
        </span>
        <span className="inline-flex rounded bg-[var(--slate-800)] px-2 py-0.5 text-xs font-medium text-[var(--slate-400)]">
          {sectionLabel[exam.section] ?? exam.section}
        </span>
        {isCompleted && (
          <span className="inline-flex rounded bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">
            Soumis
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-semibold text-[var(--brand-white)] leading-snug">
        {exam.title}
      </h3>

      {/* Meta */}
      <div className="mb-4 flex gap-4 text-xs text-[var(--slate-500)]">
        <span>{exam.max_duration} min</span>
        <span>Min. {exam.min_words} mots</span>
      </div>

      {/* CTA */}
      {isCompleted ? (
        <Button variant="secondary" size="sm" onClick={handleViewResult}>
          Voir le résultat
        </Button>
      ) : isInProgress ? (
        <Button variant="secondary" size="sm" onClick={handleResume}>
          Reprendre
        </Button>
      ) : isLocked ? (
        <Button variant="ghost" size="sm" href="/dashboard/billing">
          Contacter le support
        </Button>
      ) : (
        <Button size="sm" onClick={handleStart} loading={loading}>
          Commencer la simulation
        </Button>
      )}
    </div>
  );
}
