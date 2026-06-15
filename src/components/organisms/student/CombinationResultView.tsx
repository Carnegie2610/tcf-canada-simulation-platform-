"use client";

import { useState } from "react";
import { BackButton } from "@/components/atoms/BackButton";
import type { CombinationTaskEval } from "@/lib/schemas";

interface CombinationResultViewProps {
  combinationTitle: string;
  examType: string;
  globalScore: number;
  cefrLevel: string;
  appreciation: string;
  task1: CombinationTaskEval;
  task2: CombinationTaskEval;
  task3: CombinationTaskEval;
  createdAt: string;
}

const CEFR_COLOR: Record<string, string> = {
  C2: "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  C1: "bg-emerald-900/40 text-emerald-400 border-emerald-800/50",
  B2: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  B1: "bg-amber-900/50 text-amber-300 border-amber-700/50",
  A2: "bg-red-900/40 text-red-400 border-red-800/50",
  A1: "bg-red-900/60 text-red-300 border-red-700/50",
};

function TaskPanel({ label, task, maxScore }: { label: string; task: CombinationTaskEval; maxScore: string }) {
  const [showCorrection, setShowCorrection] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Task header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
        <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-300">
          {task.score} pts
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Original text */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Votre texte
          </p>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
            {task.votre_texte || "—"}
          </p>
        </div>

        {/* Evaluation criteria */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Compréhension du sujet", value: task.comprehension_du_sujet },
            { label: "Respect de méthodologie", value: task.respect_de_methodologie },
            { label: "Niveau linguistique", value: task.niveau_linguistique },
            { label: "Appréciation générale", value: task.appreciation_generale },
          ].map(({ label: l, value }) => (
            <div key={l} className="rounded-lg bg-slate-800/40 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{l}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Orthographic corrections */}
        {task.correction_orthographique.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Corrections orthographiques ({task.correction_orthographique.length})
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-800/60">
                  <tr>
                    {["Erreur", "Correction", "Type", "Explication"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {task.correction_orthographique.map((c, i) => (
                    <tr key={i} className="border-t border-slate-800/60">
                      <td className="px-3 py-2 text-red-400 font-mono">{c.erreur}</td>
                      <td className="px-3 py-2 text-emerald-400 font-mono">{c.correction}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{c.type}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{c.explication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {task.correction_orthographique.length === 0 && (
          <p className="text-xs text-emerald-500">✓ Aucune erreur orthographique détectée.</p>
        )}

        {/* Version corrigée toggle */}
        <div>
          <button
            onClick={() => setShowCorrection((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span className={`transition-transform ${showCorrection ? "rotate-90" : ""}`}>▶</span>
            {showCorrection ? "Masquer la version C1/C2" : "✦ Voir la version C1/C2"}
          </button>
          {showCorrection && (
            <div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4 secure-canvas-wrapper print:block">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Version corrigée et améliorée — {maxScore}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {task.version_corrigee_et_amelioree}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CombinationResultView({
  combinationTitle,
  examType,
  globalScore,
  cefrLevel,
  appreciation,
  task1,
  task2,
  task3,
  createdAt,
}: CombinationResultViewProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  const tasks = [
    { key: 1 as const, label: "Tâche 1", task: task1, maxScore: "4 pts" },
    { key: 2 as const, label: "Tâche 2", task: task2, maxScore: "7 pts" },
    { key: 3 as const, label: "Tâche 3", task: task3, maxScore: "9 pts" },
  ];

  const cefrClass = CEFR_COLOR[cefrLevel] ?? "bg-slate-800 text-slate-300 border-slate-700";

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between print:hidden">
        <BackButton href="/dashboard/combinations" label="Combinaisons" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          📥 Télécharger mon rapport (PDF)
        </button>
      </div>

      {/* Score header card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
              {examType} Canada
            </p>
            <h1 className="text-xl font-extrabold text-slate-100">{combinationTitle}</h1>
            <p className="mt-1 text-xs text-slate-600">
              Évalué le {new Date(createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-xl border px-4 py-2 text-2xl font-extrabold ${cefrClass}`}>
              {cefrLevel}
            </span>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-slate-100">{globalScore.toFixed(1)}<span className="text-lg text-slate-500">/20</span></p>
              <p className="text-xs text-slate-500 mt-0.5">{appreciation}</p>
            </div>
          </div>
        </div>

        {/* Task score pills */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {tasks.map(({ key, label, task }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === key
                  ? "border-blue-600/50 bg-blue-950/60 text-blue-300"
                  : "border-slate-800 bg-slate-800/40 text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}: {task.score}
            </button>
          ))}
        </div>
      </div>

      {/* Active task panel */}
      {tasks.map(({ key, label, task, maxScore }) =>
        activeTab === key ? (
          <TaskPanel key={key} label={label} task={task} maxScore={maxScore} />
        ) : null
      )}

      {/* Print: show all tasks */}
      <div className="hidden print:block space-y-6">
        {tasks.map(({ key, label, task, maxScore }) => (
          <TaskPanel key={key} label={label} task={task} maxScore={maxScore} />
        ))}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white; color: black; }
          .secure-canvas-wrapper { user-select: text !important; pointer-events: auto !important; }
        }
      `}</style>
    </div>
  );
}
