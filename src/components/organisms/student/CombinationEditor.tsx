"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamTimer } from "@/hooks/useExamTimer";
import { SubmissionGate } from "@/components/organisms/student/SubmissionGate";
import { AiLoadingHub } from "@/components/organisms/student/AiLoadingHub";
import type { Combination } from "@/lib/admin/types";

interface CombinationEditorProps {
  combination: Combination;
  submissionId: string;
  initialDrafts: [string, string, string];
  initialWordCounts: [number, number, number];
}

type TaskKey = 1 | 2 | 3;

const ACCENTS = [
  "à", "â", "ä", "é", "è", "ê",
  "ë", "î", "ï", "ô", "ö", "œ",
  "û", "ù", "ü", "ç", "«", "»",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isTaskValid(count: number, min: number, max: number): boolean {
  return count >= min && count <= max;
}

function storageKey(submissionId: string): string {
  return `combination_draft_${submissionId}`;
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/40 p-3 ${className}`}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
        {title}
      </p>
      {children}
    </div>
  );
}

function loadFromStorage(
  submissionId: string,
  initial: [string, string, string]
): [string, string, string] {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(storageKey(submissionId));
    if (!raw) return initial;
    const saved = JSON.parse(raw) as Record<string, string>;
    return [
      (saved["1"] ?? "").length > initial[0].length ? saved["1"] : initial[0],
      (saved["2"] ?? "").length > initial[1].length ? saved["2"] : initial[1],
      (saved["3"] ?? "").length > initial[2].length ? saved["3"] : initial[2],
    ];
  } catch {
    return initial;
  }
}

export function CombinationEditor({
  combination,
  submissionId,
  initialDrafts,
  initialWordCounts: _initialWordCounts,
}: CombinationEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);
  const draftsRef = useRef<[string, string, string]>(initialDrafts);

  const [activeTask, setActiveTask] = useState<TaskKey>(1);
  const [drafts, setDrafts] = useState<[string, string, string]>(() =>
    loadFromStorage(submissionId, initialDrafts)
  );
  const [wordCounts, setWordCounts] = useState<[number, number, number]>(() => [
    countWords(drafts[0]),
    countWords(drafts[1]),
    countWords(drafts[2]),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [showExpiredOverlay, setShowExpiredOverlay] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAiHub, setShowAiHub] = useState(false);
  const [aiError, setAiError] = useState(false);

  const { timeLeft, isExpired } = useExamTimer(combination.global_duration);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  // Recovery banner on mount if sessionStorage had longer content
  useEffect(() => {
    const restored = loadFromStorage(submissionId, initialDrafts);
    const anyRestored = restored.some((d, i) => d.length > initialDrafts[i].length);
    if (anyRestored) {
      setShowRecoveryBanner(true);
      const id = setTimeout(() => setShowRecoveryBanner(false), 5000);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // Silent 10-second sessionStorage autosave
  useEffect(() => {
    const id = setInterval(() => {
      const d = draftsRef.current;
      sessionStorage.setItem(
        storageKey(submissionId),
        JSON.stringify({ "1": d[0], "2": d[1], "3": d[2] })
      );
    }, 10_000);
    return () => clearInterval(id);
  }, [submissionId]);

  // Debounced 30s server PATCH autosave
  const serverSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(task: TaskKey, value: string) {
    if (serverSaveRef.current) clearTimeout(serverSaveRef.current);
    serverSaveRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await fetch(`/api/student/combination-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          [`draft_task_${task}`]: value,
          [`word_count_${task}`]: countWords(value),
        }),
      });
      setSaveStatus("saved");
    }, 30_000);
  }

  const submitAll = useCallback(
    async (forceDrafts?: [string, string, string]) => {
      if (isLocked || isSubmitting) return;
      setIsSubmitting(true);
      const toSave = forceDrafts ?? draftsRef.current;

      await fetch(`/api/student/combination-submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draft_task_1: toSave[0],
          draft_task_2: toSave[1],
          draft_task_3: toSave[2],
          word_count_1: countWords(toSave[0]),
          word_count_2: countWords(toSave[1]),
          word_count_3: countWords(toSave[2]),
        }),
      });

      await fetch(`/api/student/combination-submissions/${submissionId}/submit`, {
        method: "POST",
      });

      sessionStorage.removeItem(storageKey(submissionId));
      setIsLocked(true);
      setShowExpiredOverlay(false);
      setIsSubmitted(true);
    },
    [isLocked, isSubmitting, submissionId]
  );

  // Show overlay on expiry, then auto-submit after 2 seconds
  useEffect(() => {
    if (isExpired && !isLocked) {
      setShowExpiredOverlay(true);
      const id = setTimeout(() => submitAll(), 2000);
      return () => clearTimeout(id);
    }
  }, [isExpired, isLocked, submitAll]);

  function handleChange(value: string) {
    const task = activeTask;
    setDrafts((prev) => {
      const next = [...prev] as [string, string, string];
      next[task - 1] = value;
      return next;
    });
    setWordCounts((prev) => {
      const next = [...prev] as [number, number, number];
      next[task - 1] = countWords(value);
      return next;
    });
    setSaveStatus("unsaved");
    scheduleSave(task, value);
  }

  function insertAccent(char: string, ref: React.RefObject<HTMLTextAreaElement | null>) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newValue = el.value.slice(0, start) + char + el.value.slice(end);
    handleChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  function goTo(delta: -1 | 1) {
    setActiveTask((t) => Math.max(1, Math.min(3, t + delta)) as TaskKey);
  }

  async function handleQuit() {
    sessionStorage.removeItem(storageKey(submissionId));
    await fetch(`/api/student/combination-submissions/${submissionId}`, {
      method: "DELETE",
    });
    router.refresh();
    router.push("/dashboard/combinations");
  }

  const tasks = [
    { key: 1 as TaskKey, label: "Tâche 1", task: combination.tasks.tache_1 },
    { key: 2 as TaskKey, label: "Tâche 2", task: combination.tasks.tache_2 },
    { key: 3 as TaskKey, label: "Tâche 3", task: combination.tasks.tache_3 },
  ];

  const activeTaskData = tasks.find((t) => t.key === activeTask)!;
  const activeDraft = drafts[activeTask - 1];
  const activeWordCount = wordCounts[activeTask - 1];
  const { minWords, maxWords } = activeTaskData.task;
  const wordCountValid = isTaskValid(activeWordCount, minWords, maxWords);

  function tabDotClass(key: TaskKey): string {
    const count = wordCounts[key - 1];
    const { minWords: mn, maxWords: mx } = tasks[key - 1].task;
    if (count === 0) return "bg-slate-600";
    if (isTaskValid(count, mn, mx)) return "bg-emerald-400";
    return "bg-amber-400";
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Sauvegarde…"
      : saveStatus === "saved"
        ? "✓ Sauvegardé"
        : "● Non sauvegardé";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950">

      {/* ── TEMPS ÉCOULÉ OVERLAY ── */}
      {showExpiredOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm">
          <p className="text-5xl font-extrabold tracking-widest uppercase text-red-500 mb-4">
            Temps écoulé
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Soumission automatique en cours…
          </p>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ animation: "slideIn 2s linear forwards" }}
            />
          </div>
          <style>{`@keyframes slideIn { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      )}

      {/* ── SUBMISSION GATE (post-submit decision) ── */}
      {isSubmitted && !showAiHub && (
        <SubmissionGate
          onDashboard={() => { router.refresh(); router.push("/dashboard/combinations"); }}
          onEvaluate={() => { setAiError(false); setShowAiHub(true); }}
        />
      )}

      {/* ── AI CORRECTION ERROR FALLBACK ── */}
      {aiError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm">
          <p className="text-2xl font-bold text-red-400 mb-3">Erreur de correction</p>
          <p className="text-sm text-slate-400 mb-6">
            Une erreur est survenue. Vos copies restent sauvegardées.
          </p>
          <button
            onClick={() => { setAiError(false); setShowAiHub(false); }}
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Retour au choix
          </button>
        </div>
      )}

      {/* ── AI LOADING HUB ── */}
      {showAiHub && !aiError && (
        <AiLoadingHub
          submissionId={submissionId}
          onError={() => { setShowAiHub(false); setAiError(true); }}
        />
      )}

      {/* ── RECOVERY BANNER ── */}
      {showRecoveryBanner && (
        <div className="shrink-0 border-b border-green-500/30 bg-green-600/20 px-6 py-2 text-center text-xs font-medium text-green-400">
          Session récupérée avec succès (sauvegardée localement)
        </div>
      )}

      {/* ── COMPONENT 1: HEADER (shared desktop + mobile) ── */}
      <header className="shrink-0 flex h-14 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-4 md:px-6 backdrop-blur-md">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="select-none bg-gradient-to-r from-[#2563eb] to-[#06b6d4] bg-clip-text text-sm md:text-base font-extrabold uppercase tracking-widest text-transparent">
            OBJECTIF 4C2
          </span>
          <span className="hidden md:block select-none text-slate-700">|</span>
          <span className="hidden md:block select-none text-xs font-light uppercase tracking-wider text-slate-500">
            Examen Simulateur
          </span>
        </div>

        {/* Center: Session badge (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="select-none text-xs font-medium uppercase tracking-wide text-emerald-400">
            Session Sécurisée (SSL)
          </span>
        </div>

        {/* Right: Timer + save status */}
        <div className="flex shrink-0 flex-col items-end">
          <span
            className={`font-mono text-base md:text-lg font-bold leading-none ${
              isExpired
                ? "text-red-400"
                : "text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            }`}
          >
            🕒 {timeLeft}
          </span>
          <span className="mt-0.5 text-[10px] text-slate-600">{saveLabel}</span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  DESKTOP LAYOUT (md+): 3-column flex-row                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* ── LEFT COLUMN (15%) ── */}
        <aside className="flex w-[15%] shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-3">

          {/* Card: Tâches */}
          <Card title="Tâches">
            <div className="flex flex-col gap-1">
              {tasks.map(({ key, label, task }) => (
                <button
                  key={key}
                  onClick={() => setActiveTask(key)}
                  disabled={isLocked}
                  className={`w-full rounded-lg border-l-2 px-3 py-2.5 text-left transition-all disabled:opacity-50 ${
                    activeTask === key
                      ? "border-l-blue-500 bg-slate-800/80 text-slate-100"
                      : "border-l-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tabDotClass(key)}`} />
                    <span className="text-xs font-semibold">{label}</span>
                  </div>
                  <p className="mt-1 pl-4 text-[10px] text-slate-600">
                    {task.minWords}–{task.maxWords} mots
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Card: Navigation (Préc/Suiv + Quitter) */}
          <Card title="Navigation">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => goTo(-1)}
                  disabled={activeTask === 1 || isLocked}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ◀ Préc.
                </button>
                <button
                  onClick={() => goTo(1)}
                  disabled={activeTask === 3 || isLocked}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suiv. ▶
                </button>
              </div>
              <button
                onClick={handleQuit}
                disabled={isLocked}
                className="w-full rounded-lg border border-red-800/60 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40"
              >
                Quitter le test
              </button>
            </div>
          </Card>
        </aside>

        {/* ── CENTER COLUMN (flex-1 / ~70%) ── */}
        <main className="flex flex-1 flex-col overflow-hidden">

          {/* Component 5: Task Prompt — scrollable, max 250px */}
          <div className="shrink-0 max-h-[250px] overflow-y-auto border-b border-slate-800 bg-slate-900/30 px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {activeTaskData.label} — Sujet
              </p>
              <p className="text-[10px] text-slate-600">
                {minWords}–{maxWords} mots
              </p>
            </div>
            <div className="pointer-events-none select-none whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {activeTaskData.task.question}
            </div>
          </div>

          {/* Component 6: Secure Textarea */}
          <textarea
            ref={textareaRef}
            value={activeDraft}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isLocked || isExpired}
            placeholder="Commencez à rédiger votre réponse ici…"
            className="flex-1 resize-none bg-slate-950 px-6 py-5 font-mono text-sm leading-relaxed text-slate-200 placeholder-slate-700 focus:outline-none disabled:opacity-60"
          />
        </main>

        {/* ── RIGHT COLUMN (15%) ── */}
        <aside className="flex w-[15%] shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-800 bg-slate-900/40 p-3">

          {/* Card: Compteur */}
          <Card title="Compteur">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <p
                className={`text-3xl font-bold leading-none ${
                  activeWordCount === 0
                    ? "text-slate-500"
                    : wordCountValid
                      ? "text-emerald-400"
                      : "text-red-400"
                }`}
              >
                {activeWordCount}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">mots</p>
              <div className="mt-2 border-t border-slate-800 pt-2 text-[10px] text-slate-500">
                <span className="text-slate-400">Min:</span>{" "}{minWords}{" "}
                <span className="text-slate-400">Max:</span>{" "}{maxWords}
              </div>
            </div>
          </Card>

          {/* Card: Caractères spéciaux */}
          <Card title="Caractères spéciaux">
            <div className="grid grid-cols-3 gap-1">
              {ACCENTS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertAccent(char, textareaRef)}
                  disabled={isLocked || isExpired}
                  title={`Insérer ${char}`}
                  className="rounded px-1 py-1.5 text-sm font-medium text-slate-300 transition-colors bg-slate-800 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {char}
                </button>
              ))}
            </div>
          </Card>

          {/* Submit — below Caractères spéciaux on desktop */}
          <button
            onClick={() => submitAll()}
            disabled={isLocked || isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Soumission…" : "Soumettre l'éval."}
          </button>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MOBILE LAYOUT (< md): stacked vertical                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 overflow-auto md:hidden">

        {/* 3. Tâches (vertical, left) + Navigation (right) */}
        <div className="shrink-0 flex gap-2 mx-3 mt-3">
          <div className="flex-[1.3]">
            <Card title="Tâches">
              <div className="flex flex-col gap-1.5">
                {tasks.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTask(key)}
                    disabled={isLocked}
                    className={`flex items-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-bold transition-all disabled:opacity-50 ${
                      activeTask === key
                        ? "border-blue-500 bg-blue-950/60 text-blue-300"
                        : "border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tabDotClass(key)}`} />
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex-1">
            <Card title="Navigation">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => goTo(-1)}
                  disabled={activeTask === 1 || isLocked}
                  className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ◀ Préc.
                </button>
                <button
                  onClick={() => goTo(1)}
                  disabled={activeTask === 3 || isLocked}
                  className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suiv. ▶
                </button>
                <button
                  onClick={() => submitAll()}
                  disabled={isLocked || isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Soumission…" : "Soumettre l'éval."}
                </button>
                <button
                  onClick={handleQuit}
                  disabled={isLocked}
                  className="w-full rounded-lg border border-red-800/60 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40"
                >
                  Quitter le test
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* 4. Active question (scrollable, max 35vh) */}
        <div className="shrink-0 max-h-[35vh] overflow-y-auto border-b border-slate-800 bg-slate-900/30 px-4 py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {activeTaskData.label} — Sujet
          </p>
          <div className="pointer-events-none select-none whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {activeTaskData.task.question}
          </div>
        </div>

        {/* 5. Textarea — its own bordered block, separate from the row below */}
        <div className="shrink-0 mx-3 mt-3 overflow-hidden rounded-xl border border-slate-800">
          <textarea
            ref={mobileTextareaRef}
            value={activeDraft}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isLocked || isExpired}
            placeholder="Commencez à rédiger votre réponse ici…"
            className="h-[40vh] w-full resize-none bg-slate-950 px-4 py-4 font-mono text-sm leading-relaxed text-slate-200 placeholder-slate-700 focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* 6. Compteur + Caractères spéciaux (each its own card, side-by-side) */}
        <div className="shrink-0 grid grid-cols-2 gap-2 mx-3 mt-3 mb-3">
          {/* Card: Compteur */}
          <Card title="Compteur">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <p
                className={`text-2xl font-bold leading-none ${
                  activeWordCount === 0
                    ? "text-slate-500"
                    : wordCountValid
                      ? "text-emerald-400"
                      : "text-red-400"
                }`}
              >
                {activeWordCount}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">mots</p>
              <p className="mt-1 text-[10px] text-slate-600">
                {minWords}–{maxWords}
              </p>
            </div>
          </Card>

          {/* Card: Caractères spéciaux */}
          <Card title="Caractères spéciaux">
            <div className="grid grid-cols-6 gap-0.5">
              {ACCENTS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertAccent(char, mobileTextareaRef)}
                  disabled={isLocked || isExpired}
                  title={`Insérer ${char}`}
                  className="rounded px-1 py-1 text-xs font-medium text-slate-300 transition-colors bg-slate-800 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {char}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
