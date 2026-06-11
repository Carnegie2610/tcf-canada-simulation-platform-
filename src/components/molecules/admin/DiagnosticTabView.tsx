"use client";

import { useState } from "react";
import { ScorePill } from "@/components/atoms/ScorePill";
import { ProtectedContent } from "@/components/atoms/ProtectedContent";
import type { Evaluation } from "@/lib/admin/types";

interface DiagnosticTabViewProps {
  evaluation: Evaluation | null;
  aiEnabled: boolean;
}

type Tab = "scores" | "corrections" | "modele";

export function DiagnosticTabView({ evaluation, aiEnabled }: DiagnosticTabViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("scores");

  if (!evaluation) {
    return (
      <div className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50 p-4 text-center">
        {aiEnabled ? (
          <p className="text-sm text-[var(--slate-400)]">
            Évaluation en cours — résultat disponible après correction IA.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--slate-400)]">
              Feedback IA désactivé : cette soumission a été générée sur un plan où l&apos;évaluation IA n&apos;est pas active.
            </p>
            <p className="text-xs text-[var(--slate-500)]">
              Bouton « Déclencher évaluation IA » disponible sur demande (consomme 1 token administrateur).
            </p>
          </div>
        )}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "scores", label: "Scores" },
    { key: "corrections", label: "Corrections" },
    { key: "modele", label: "Modèle C2" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-[var(--slate-700)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[var(--blue-500)] text-[var(--blue-500)]"
                : "text-[var(--slate-400)] hover:text-[var(--brand-white)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "scores" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <ScorePill score={evaluation.global_score} maxScore={100} label="Global" />
            <ScorePill score={evaluation.grammar_score} maxScore={20} label="Grammaire" />
            <ScorePill score={evaluation.lexical_score} maxScore={20} label="Lexique" />
            <ScorePill score={evaluation.coherence_score} maxScore={20} label="Cohérence" />
          </div>
        </div>
      )}

      {activeTab === "corrections" && (
        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {evaluation.json_feedback.corrections.length === 0 ? (
            <p className="text-sm text-[var(--slate-500)]">
              Aucune correction spécifique notée.
            </p>
          ) : (
            evaluation.json_feedback.corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--brand-red)]/20 px-1.5 py-0.5 text-xs font-medium text-[var(--brand-red)]">
                    {c.errorType}
                  </span>
                </div>
                <p className="text-xs text-[var(--slate-400)] line-through">{c.originalSegment}</p>
                <p className="text-xs text-emerald-400">{c.correctedSegment}</p>
                <p className="text-xs text-[var(--slate-500)]">{c.explanationFr}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "modele" && (
        <ProtectedContent className="max-h-64 overflow-y-auto rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] p-4">
          <p className="text-sm leading-relaxed text-[var(--slate-300)] whitespace-pre-wrap">
            {evaluation.model_answer_c2}
          </p>
        </ProtectedContent>
      )}
    </div>
  );
}
