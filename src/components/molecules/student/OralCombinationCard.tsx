"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OralCombination } from "@/lib/admin/types";
import type { OralSubmission } from "@/lib/student/queries";

interface OralCombinationCardProps {
  oralCombination: OralCombination;
  submission: OralSubmission | null;
  quotaExceeded: boolean;
  expiresAt: string;
}

function formatMinutes(seconds: number): string {
  const min = Math.round(seconds / 60);
  return `${min} min`;
}

export function OralCombinationCard({
  oralCombination,
  submission,
  quotaExceeded,
  expiresAt,
}: OralCombinationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [guardMessage, setGuardMessage] = useState<string | null>(null);

  const taskDurations = [
    oralCombination.tasks.tache_1.speakingTimeSeconds,
    oralCombination.tasks.tache_2.speakingTimeSeconds,
    oralCombination.tasks.tache_3.speakingTimeSeconds,
  ];
  const durationsLabel = taskDurations.map(formatMinutes).join(" / ");

  const isSubmitted = submission?.is_completed === true;
  const isInProgress = submission !== null && !isSubmitted;
  const isLocked = quotaExceeded && !isInProgress && !isSubmitted;

  async function handleStart() {
    // Client-side security guards
    const isExpired = new Date(expiresAt) <= new Date();
    if (isExpired) {
      setGuardMessage(
        `Votre abonnement a expiré. Veuillez contacter un administrateur pour renouveler votre accès.`
      );
      return;
    }
    if (isLocked) {
      setGuardMessage(
        `Quota atteint. Vous avez utilisé toutes vos simulations disponibles dans votre formule.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/oral-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oralCombinationId: oralCombination.id }),
      });
      const data = (await res.json()) as { submissionId?: string; error?: string };
      if (!res.ok || !data.submissionId) {
        setGuardMessage("Quota épuisé ou erreur. Veuillez contacter le support.");
        setLoading(false);
        return;
      }
      router.push(
        `/dashboard/expression-orale/attempt/${oralCombination.id}?sid=${data.submissionId}`
      );
    } catch {
      setLoading(false);
    }
  }

  function handleResume() {
    router.push(
      `/dashboard/expression-orale/attempt/${oralCombination.id}?sid=${submission!.id}`
    );
  }

  return (
    <>
      {/* Guard modal */}
      {guardMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setGuardMessage(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[var(--slate-900)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm font-semibold text-[var(--accent-red-text)]">Accès refusé</p>
            <p className="text-sm text-[var(--slate-200)] leading-relaxed">{guardMessage}</p>
            <button
              onClick={() => setGuardMessage(null)}
              className="mt-4 w-full rounded-xl bg-[var(--slate-800)] py-2 text-xs font-medium text-[var(--slate-200)] hover:bg-[var(--slate-700)] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div
        className={`group relative rounded-2xl border-2 p-6 shadow-md shadow-black/20 transition-all duration-300 ease-out transform translate-y-0 ${
          isSubmitted || isLocked
            ? "border-[var(--slate-700)] bg-[var(--slate-900)]/40 opacity-70"
            : "border-[var(--slate-700)] bg-[var(--slate-900)]/60 hover:-translate-y-2 hover:border-blue-500/40 hover:bg-[var(--slate-900)]/90 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] cursor-pointer"
        }`}
      >
        {/* 1. Header Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-teal-text)]">
            <span className="text-sm">🎙️</span> Expression Orale
          </span>
          <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
            ⚡ {oralCombination.exam_type} Canada
          </span>
        </div>

        {/* 2. Bold Name & Theme */}
        <div className="mb-6">
          <h3 className="flex items-start gap-2 text-xl font-extrabold text-[var(--slate-200)] line-clamp-2 transition-colors duration-200">
            <span>📁</span> {oralCombination.title}
          </h3>
        </div>

        {/* 3. Metadata Row */}
        <div className="border-t border-[var(--slate-800)]/60 pt-4 mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--slate-200)]">
            <span className="flex items-center gap-1.5 font-medium">
              <span>📋</span> 3 Tâches
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>⏱️</span> {oralCombination.global_duration} Min.
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>🗣️</span> {durationsLabel}
            </span>
          </div>
          <div className="flex items-center justify-end text-xs">
            {isSubmitted ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--slate-800)] text-[var(--slate-400)] text-[10px] font-bold uppercase tracking-wider">
                🔒 Soumis
              </span>
            ) : isInProgress ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-900/50">
                ✏️ En cours
              </span>
            ) : isLocked ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--slate-800)] text-[var(--slate-500)] text-[10px] font-bold uppercase tracking-wider">
                🔒 Bloqué
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Prêt
              </span>
            )}
          </div>
        </div>

        {/* 4. CTA Button */}
        <div className="mt-5">
          {isSubmitted ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[var(--slate-800)]/40 text-[var(--slate-500)] border border-[var(--slate-800)] cursor-not-allowed flex items-center justify-center"
            >
              Simulation soumise
            </button>
          ) : isInProgress ? (
            <button
              onClick={handleResume}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-amber-900/20"
            >
              Reprendre la simulation
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isLocked || loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
                isLocked
                  ? "bg-[var(--slate-800)]/40 text-[var(--slate-500)] border border-[var(--slate-800)] cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-blue-900/20"
              }`}
            >
              {loading ? "Démarrage..." : "🚀 Commencer la simulation"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
