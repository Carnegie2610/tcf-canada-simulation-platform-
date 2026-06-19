"use client";

import { useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import type { CombinationTaskEval } from "@/lib/schemas";
import type { Combination } from "@/lib/admin/types";
import { CombinationPdfDocument } from "@/components/organisms/student/pdf/CombinationPdfDocument";

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
  combination?: Combination;
  studentName?: string;
}

const CEFR_COLOR: Record<string, string> = {
  C2:    "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  "C1+": "bg-emerald-900/40 text-emerald-400 border-emerald-800/50",
  C1:    "bg-teal-900/50 text-teal-300 border-teal-700/50",
  "B2+": "bg-blue-900/50 text-blue-300 border-blue-700/50",
  B2:    "bg-blue-900/40 text-blue-400 border-blue-800/50",
  "B1+": "bg-indigo-900/50 text-indigo-300 border-indigo-700/50",
  B1:    "bg-amber-900/50 text-amber-300 border-amber-700/50",
  A2:    "bg-red-900/40 text-red-400 border-red-800/50",
  A1:    "bg-red-900/60 text-red-300 border-red-700/50",
};

function ModelSolutionModal({
  combination,
  onClose,
}: {
  combination: Combination;
  onClose: () => void;
}) {
  const taskSections = [
    { label: "Tâche 1 — Message",    task: combination.tasks.tache_1 },
    { label: "Tâche 2 — Rédaction", task: combination.tasks.tache_2 },
    { label: "Tâche 3 — Rédaction", task: combination.tasks.tache_3 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-100">
              📁 Solution Modèle de Référence
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Correction Expert C2 — {combination.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            ✕ Fermer
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {taskSections.map(({ label, task }) => (
            <div key={label} className="px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">{label}</h3>
                <span className="text-xs text-slate-500">{task.minWords}–{task.maxWords} mots</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Sujet</p>
                <p className="text-xs text-slate-400 leading-relaxed">{task.question}</p>
              </div>
              <div className="secure-canvas-wrapper rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                  Solution Modèle (Niveau C2)
                </p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {task.solution || "Solution non disponible."}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskPanel({
  label,
  task,
  maxScore,
}: {
  label: string;
  task: CombinationTaskEval;
  maxScore: string;
}) {
  return (
    <div className="task-panel rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Task header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <h3 className="text-base font-bold text-slate-100">{label}</h3>
        <span className="rounded-full bg-slate-800 px-4 py-1 text-sm font-bold text-slate-300">
          {task.score} pts
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Section A — Votre texte */}
        <div className="print-section-a space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Section A — Votre texte
          </p>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {task.votre_texte || "—"}
            </p>
          </div>
        </div>

        {/* Section B — Critères CECR, each on its own full-width row */}
        <div className="print-section-b space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Section B — Critères CECR
          </p>
          <div className="space-y-3">
            {[
              { label: "Compréhension du sujet",  value: task.comprehension_du_sujet },
              { label: "Respect de méthodologie", value: task.respect_de_methodologie },
              { label: "Niveau linguistique",       value: task.niveau_linguistique },
              { label: "Appréciation générale",     value: task.appreciation_generale },
            ].map(({ label: l, value }) => (
              <div
                key={l}
                className="criteria-block rounded-lg bg-slate-800/40 p-4 border-l-2 border-blue-700/40"
              >
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  {l}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section C — Corrections orthographiques */}
        <div className="print-section-c space-y-2">
          {task.correction_orthographique.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Section C — Corrections orthographiques ({task.correction_orthographique.length})
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/60">
                    <tr>
                      {["Erreur", "Correction", "Type", "Explication"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {task.correction_orthographique.map((c, i) => (
                      <tr key={i} className="border-t border-slate-800/60">
                        <td className="px-3 py-2.5 text-red-400 font-mono text-xs">{c.erreur}</td>
                        <td className="px-3 py-2.5 text-emerald-400 font-mono text-xs">{c.correction}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                            {c.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-slate-400">{c.explication}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-emerald-500">✓ Aucune erreur orthographique détectée.</p>
          )}
        </div>

        {/* Section D — Solution proposée par l'IA (always visible, no toggle) */}
        <div className="print-model-solution space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Section D — Solution proposée par l&apos;IA
          </p>
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              Version corrigée &amp; améliorée — {maxScore}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {task.version_corrigee_et_amelioree}
            </p>
          </div>
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
  combination,
  studentName,
}: CombinationResultViewProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [showModal, setShowModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const tasks = [
    { key: 1 as const, label: "Tâche 1 — Message",    task: task1, maxScore: "4 pts" },
    { key: 2 as const, label: "Tâche 2 — Rédaction", task: task2, maxScore: "7 pts" },
    { key: 3 as const, label: "Tâche 3 — Rédaction", task: task3, maxScore: "9 pts" },
  ];

  const cefrClass = CEFR_COLOR[cefrLevel] ?? "bg-slate-800 text-slate-300 border-slate-700";
  const evalDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    try {
      const blob = await pdf(
        <CombinationPdfDocument
          combinationTitle={combinationTitle}
          examType={examType}
          globalScore={globalScore}
          cefrLevel={cefrLevel}
          appreciation={appreciation}
          task1={task1}
          task2={task2}
          task3={task3}
          createdAt={createdAt}
          studentName={studentName}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${combinationTitle.replace(/\s+/g, "_")}_rapport.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Solution modal — never included in the PDF export */}
      {showModal && combination && (
        <ModelSolutionModal combination={combination} onClose={() => setShowModal(false)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
        >
          ← Historique &amp; Progrès
        </Link>
        <div className="flex-1" />
        {combination && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-800/50 bg-blue-950/30 px-4 py-2 text-xs font-medium text-blue-300 transition-all duration-200 hover:bg-blue-900/50 hover:text-blue-200"
          >
            📁 Solution Modèle de Référence
          </button>
        )}
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloadingPdf ? "Génération du PDF…" : "📥 Télécharger le PDF complet"}
        </button>
      </div>

      {/* Score summary card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
              {examType} Canada
            </p>
            <h1 className="text-xl font-extrabold text-slate-100">{combinationTitle}</h1>
            <p className="mt-1 text-xs text-slate-600">Évalué le {evalDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-xl border px-4 py-2 text-2xl font-extrabold ${cefrClass}`}>
              {cefrLevel}
            </span>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-slate-100">
                {globalScore.toFixed(1)}
                <span className="text-lg text-slate-500">/20</span>
              </p>
              <p className="text-sm text-slate-500 mt-0.5">{appreciation}</p>
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {tasks.map(({ key, label, task }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-lg border px-3 py-3.5 text-sm font-bold transition-all ${
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
      <div>
        {tasks.map(({ key, label, task, maxScore }) =>
          activeTab === key ? (
            <TaskPanel key={key} label={label} task={task} maxScore={maxScore} />
          ) : null
        )}
      </div>
    </div>
  );
}
