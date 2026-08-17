"use client";

import { useState } from "react";
import Link from "next/link";
import type { OralTaskEval } from "@/lib/schemas";

interface OralResultViewProps {
  oralCombinationTitle: string;
  examType: string;
  globalScore: number;
  cefrLevel: string;
  appreciation: string;
  task1: OralTaskEval;
  task2: OralTaskEval;
  task3: OralTaskEval;
  speakingDurationSeconds1: number;
  speakingDurationSeconds2: number;
  speakingDurationSeconds3: number;
  createdAt: string;
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

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes} min ${seconds.toString().padStart(2, "0")}s`;
}

function TaskPanel({
  label,
  task,
  speakingDurationSeconds,
}: {
  label: string;
  task: OralTaskEval;
  speakingDurationSeconds: number;
}) {
  const pointsForts = task.points_forts ?? [];
  const prioritesATravailler = task.priorites_a_travailler ?? [];
  const erreursRecurrentes = task.erreurs_recurrentes ?? [];
  const connecteursLogiques = task.connecteurs_logiques ?? { utilises: [], manquants: [] };

  return (
    <div className="task-panel rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/50 overflow-hidden">
      {/* Task header */}
      <div className="flex items-center justify-between border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-6 py-4">
        <h3 className="text-base font-bold text-[var(--slate-200)]">{label}</h3>
        <div className="flex items-center gap-2">
          {task.pertinence_verdict && (
            <span className="rounded-full border border-[var(--slate-700)] bg-[var(--slate-800)]/60 px-3 py-1 text-[11px] font-semibold text-[var(--slate-400)]">
              {task.pertinence_verdict}
            </span>
          )}
          <span className="rounded-full bg-[var(--slate-800)] px-4 py-1 text-sm font-bold text-[var(--slate-200)]">
            {task.score} pts
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Section A — Transcription */}
        <div className="print-section-a space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Section A — Transcription de votre réponse orale
          </p>
          <div className="secure-canvas-wrapper rounded-lg border border-[var(--slate-700)]/50 bg-[var(--slate-800)]/30 p-4">
            <p className="text-sm text-[var(--slate-200)] leading-relaxed whitespace-pre-wrap">
              {task.transcript || "—"}
            </p>
          </div>
        </div>

        {/* Section B — Critères CECR */}
        <div className="print-section-b space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Section B — Critères CECR
          </p>
          <div className="criteria-block rounded-lg bg-[var(--slate-800)]/40 p-4 border-l-2 border-emerald-700/40">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
              Durée de la réponse
            </p>
            <p className="text-sm text-[var(--slate-200)] leading-relaxed">
              {formatDuration(speakingDurationSeconds)}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Compréhension du sujet",       value: task.comprehension_du_sujet },
              { label: "Respect de méthodologie",      value: task.respect_de_methodologie },
              { label: "Niveau linguistique",          value: task.niveau_linguistique },
              { label: "Fluidité",                     value: task.fluidite },
              { label: "Prononciation & intonation",   value: task.prononciation_et_intonation },
              { label: "Appréciation générale",        value: task.appreciation_generale },
            ].map(({ label: l, value }) => (
              <div
                key={l}
                className="criteria-block secure-canvas-wrapper rounded-lg bg-[var(--slate-800)]/40 p-4 border-l-2 border-blue-700/40"
              >
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  {l}
                </p>
                <p className="text-sm text-[var(--slate-200)] leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section C — Points forts, priorités, erreurs récurrentes */}
        {(pointsForts.length > 0 ||
          prioritesATravailler.length > 0 ||
          erreursRecurrentes.length > 0 ||
          task.registre_et_tonalite ||
          connecteursLogiques.utilises.length > 0 ||
          connecteursLogiques.manquants.length > 0 ||
          task.exercice_recommande ||
          task.comparaison_niveau_vise) && (
          <div className="print-section-c-analysis space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
              Section C — Analyse complémentaire
            </p>

            {pointsForts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Points forts
                </p>
                {pointsForts.map((p, i) => (
                  <div
                    key={i}
                    className="secure-canvas-wrapper rounded-lg bg-emerald-950/20 border-l-2 border-emerald-700/40 p-4"
                  >
                    <p className="text-sm text-[var(--slate-200)] leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            )}

            {prioritesATravailler.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Priorités à travailler
                </p>
                {prioritesATravailler.map((p, i) => (
                  <div
                    key={i}
                    className="secure-canvas-wrapper rounded-lg border border-blue-800/30 bg-blue-950/20 p-4"
                  >
                    <p className="text-sm text-[var(--slate-200)] leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            )}

            {erreursRecurrentes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Erreurs récurrentes
                </p>
                {erreursRecurrentes.map((r, i) => (
                  <div
                    key={i}
                    className="secure-canvas-wrapper rounded-lg bg-amber-950/20 border-l-2 border-amber-700/40 p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--accent-amber-text)]">
                      {r.pattern} <span className="font-normal text-[var(--accent-amber-text)]">— {r.occurrences}×</span>
                    </p>
                    {r.exemples.length > 0 && (
                      <p className="mt-1 text-sm text-[var(--slate-400)] leading-relaxed">{r.exemples.join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {task.registre_et_tonalite && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Registre et tonalité
                </p>
                <div className="secure-canvas-wrapper rounded-lg bg-[var(--slate-800)]/40 p-4">
                  <p className="text-sm text-[var(--slate-200)] leading-relaxed">{task.registre_et_tonalite}</p>
                </div>
              </div>
            )}

            {(connecteursLogiques.utilises.length > 0 || connecteursLogiques.manquants.length > 0) && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Connecteurs logiques
                </p>
                <div className="rounded-lg bg-[var(--slate-800)]/40 p-4 space-y-1">
                  {connecteursLogiques.utilises.length > 0 && (
                    <p className="text-sm text-[var(--slate-200)] leading-relaxed">
                      <span className="text-[var(--slate-500)]">Utilisés : </span>
                      {connecteursLogiques.utilises.join(", ")}
                    </p>
                  )}
                  {connecteursLogiques.manquants.length > 0 && (
                    <p className="text-sm text-[var(--slate-200)] leading-relaxed">
                      <span className="text-[var(--slate-500)]">À enrichir : </span>
                      {connecteursLogiques.manquants.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {task.exercice_recommande && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Exercice recommandé
                </p>
                <div className="rounded-lg bg-[var(--slate-800)]/40 p-4">
                  <p className="text-sm text-[var(--slate-200)] leading-relaxed">{task.exercice_recommande}</p>
                </div>
              </div>
            )}

            {task.comparaison_niveau_vise && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Comparaison au niveau visé
                </p>
                <div className="rounded-lg bg-[var(--slate-800)]/40 p-4">
                  <p className="text-sm text-[var(--slate-200)] leading-relaxed">{task.comparaison_niveau_vise}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OralResultView({
  oralCombinationTitle,
  examType,
  globalScore,
  cefrLevel,
  appreciation,
  task1,
  task2,
  task3,
  speakingDurationSeconds1,
  speakingDurationSeconds2,
  speakingDurationSeconds3,
  createdAt,
  studentName,
}: OralResultViewProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const tasks = [
    { key: 1 as const, label: "Tâche 1", task: task1, duration: speakingDurationSeconds1 },
    { key: 2 as const, label: "Tâche 2", task: task2, duration: speakingDurationSeconds2 },
    { key: 3 as const, label: "Tâche 3", task: task3, duration: speakingDurationSeconds3 },
  ];

  const cefrClass = CEFR_COLOR[cefrLevel] ?? "bg-[var(--slate-800)] text-[var(--slate-200)] border-[var(--slate-700)]";
  const evalDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    try {
      const [{ pdf }, { OralPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/organisms/student/pdf/OralPdfDocument"),
      ]);
      const blob = await pdf(
        <OralPdfDocument
          oralCombinationTitle={oralCombinationTitle}
          examType={examType}
          globalScore={globalScore}
          cefrLevel={cefrLevel}
          appreciation={appreciation}
          task1={task1}
          task2={task2}
          task3={task3}
          speakingDurationSeconds1={speakingDurationSeconds1}
          speakingDurationSeconds2={speakingDurationSeconds2}
          speakingDurationSeconds3={speakingDurationSeconds3}
          createdAt={createdAt}
          studentName={studentName}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${oralCombinationTitle.replace(/\s+/g, "_")}_rapport_oral.pdf`;
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1.5 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/60 px-4 py-2 text-xs font-medium text-[var(--slate-200)] transition-all duration-200 hover:bg-[var(--slate-800)]"
        >
          ← Historique &amp; Progrès
        </Link>
        <div className="flex-1" />
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-2 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/60 px-4 py-2 text-xs font-medium text-[var(--slate-200)] transition-all duration-200 hover:bg-[var(--slate-800)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloadingPdf ? "Génération du PDF…" : "📥 Télécharger le PDF"}
        </button>
      </div>

      {/* Score summary card */}
      <div className="rounded-2xl border border-[var(--slate-800)] bg-[var(--slate-900)]/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)] mb-1">
              {examType} Canada — Expression Orale
            </p>
            <h1 className="text-xl font-extrabold text-[var(--slate-200)]">{oralCombinationTitle}</h1>
            <p className="mt-1 text-xs text-[var(--slate-500)]">Évalué le {evalDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-xl border px-4 py-2 text-2xl font-extrabold ${cefrClass}`}>
              {cefrLevel}
            </span>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-[var(--slate-200)]">
                {globalScore.toFixed(1)}
                <span className="text-lg text-[var(--slate-500)]">/20</span>
              </p>
              <p className="text-sm text-[var(--slate-500)] mt-0.5">{appreciation}</p>
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
                  : "border-[var(--slate-800)] bg-[var(--slate-800)]/40 text-[var(--slate-500)] hover:text-[var(--slate-200)]"
              }`}
            >
              {label}: {task.score}
            </button>
          ))}
        </div>
      </div>

      {/* Active task panel */}
      <div>
        {tasks.map(({ key, label, task, duration }) =>
          activeTab === key ? (
            <TaskPanel key={key} label={label} task={task} speakingDurationSeconds={duration} />
          ) : null
        )}
      </div>
    </div>
  );
}
