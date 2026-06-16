"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

interface CompletedCombinationCardProps {
  combination: Combination;
  submission: CombinationSubmission;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
  } | null;
  index: number;
}

const CEFR_BADGE: Record<string, string> = {
  C2:    "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  "C1+": "bg-emerald-900/40 text-emerald-400 border-emerald-800/50",
  C1:    "bg-teal-900/50 text-teal-300 border-teal-700/50",
  "B2+": "bg-blue-900/50 text-blue-300 border-blue-700/50",
  B2:    "bg-blue-900/40 text-blue-400 border-blue-800/50",
  "B1+": "bg-indigo-900/50 text-indigo-300 border-indigo-700/50",
  B1:    "bg-amber-900/50 text-amber-300 border-amber-700/50",
  A2:    "bg-red-900/40 text-red-400 border-red-800/50",
};

export function CompletedCombinationCard({
  combination,
  submission,
  evaluation,
  index,
}: CompletedCombinationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalMin =
    combination.tasks.tache_1.minWords +
    combination.tasks.tache_2.minWords +
    combination.tasks.tache_3.minWords;
  const totalMax =
    combination.tasks.tache_1.maxWords +
    combination.tasks.tache_2.maxWords +
    combination.tasks.tache_3.maxWords;

  const completedAt = submission.completed_at
    ? new Date(submission.completed_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const cefrBadgeClass = evaluation
    ? (CEFR_BADGE[evaluation.cefr_level] ?? "bg-slate-800 text-slate-300 border-slate-700")
    : null;

  async function handleEvaluate() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/student/combination-submissions/${submission.id}/evaluate`,
        { method: "POST" }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        router.push(`/dashboard/history/combination/${submission.id}`);
      } else {
        setErrorMsg(data.error ?? "Erreur lors de la correction IA.");
        setLoading(false);
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Error modal */}
      {errorMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setErrorMsg(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm font-semibold text-red-400">Erreur</p>
            <p className="text-sm text-slate-300 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="mt-4 w-full rounded-xl bg-slate-800 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]">
        {/* 1. Header badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <span className="text-sm">📝</span> Expression Écrite
          </span>
          <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
            ⚡ {combination.exam_type} Canada
          </span>
        </div>

        {/* 2. Title + optional score badge */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-extrabold text-slate-100 group-hover:text-white transition-colors duration-200">
                📁 Combinaison {index}
              </h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-1 line-clamp-2 transition-colors duration-200">
                {combination.title}
              </p>
            </div>
            {evaluation && cefrBadgeClass && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className={`rounded-lg border px-2.5 py-1 text-sm font-extrabold ${cefrBadgeClass}`}>
                  {evaluation.cefr_level}
                </span>
                <p className="text-base font-bold text-slate-200">
                  {evaluation.global_score.toFixed(1)}
                  <span className="text-xs text-slate-500">/20</span>
                </p>
              </div>
            )}
          </div>
          {completedAt && (
            <p className="mt-1.5 text-[11px] text-slate-600">Soumis le {completedAt}</p>
          )}
        </div>

        {/* 3. Metadata row */}
        <div className="border-t border-slate-800/60 pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span>📋</span> 3 Tâches
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>⏱️</span> {combination.global_duration} Min.
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>✍️</span> {totalMin}–{totalMax} mots
            </span>
          </div>
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-950 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">
              ✓ Complété
            </span>
          </div>
        </div>

        {/* 4. CTA */}
        <div className="mt-5">
          {evaluation ? (
            <Link
              href={`/dashboard/history/combination/${submission.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-blue-900/20"
            >
              🔍 Voir les détails
            </Link>
          ) : (
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 px-4 text-sm font-semibold text-white transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-amber-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Correction en cours..." : "🤖 Demander une correction IA"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
