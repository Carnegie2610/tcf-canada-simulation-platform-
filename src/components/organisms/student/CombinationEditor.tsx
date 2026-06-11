"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamTimer } from "@/hooks/useExamTimer";
import { Button } from "@/components/atoms/Button";
import { BackButton } from "@/components/atoms/BackButton";
import type { Combination } from "@/lib/admin/types";

interface CombinationEditorProps {
  combination: Combination;
  submissionId: string;
  initialDrafts: [string, string, string];
  initialWordCounts: [number, number, number];
}

type TaskKey = 1 | 2 | 3;

const ACCENTS = ["é", "è", "à", "ç", "ù", "œ", "«", "»"];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isTaskValid(count: number, min: number, max: number): boolean {
  return count >= min && count <= max;
}

function storageKey(submissionId: string): string {
  return `combination_draft_${submissionId}`;
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
  initialWordCounts,
}: CombinationEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const { timeLeft, isExpired } = useExamTimer(combination.global_duration);

  // Keep draftsRef in sync for the autosave interval (avoids stale closure)
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
      router.push("/dashboard/combinations");
    },
    [isLocked, isSubmitting, submissionId, router]
  );

  // Auto-submit on timer expiry
  useEffect(() => {
    if (isExpired && !isLocked) submitAll();
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

  function insertAccent(char: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newValue =
      el.value.slice(0, start) + char + el.value.slice(end);
    handleChange(newValue);
    // Restore cursor after injected char
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  function goTo(delta: -1 | 1) {
    setActiveTask((t) => Math.max(1, Math.min(3, t + delta)) as TaskKey);
  }

  function handleQuit() {
    // Preserve drafts in sessionStorage and exit without submitting
    const d = draftsRef.current;
    sessionStorage.setItem(
      storageKey(submissionId),
      JSON.stringify({ "1": d[0], "2": d[1], "3": d[2] })
    );
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

  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const totalMin =
    combination.tasks.tache_1.minWords +
    combination.tasks.tache_2.minWords +
    combination.tasks.tache_3.minWords;

  function tabDotClass(key: TaskKey): string {
    const count = wordCounts[key - 1];
    const { minWords: mn, maxWords: mx } = tasks[key - 1].task;
    if (count === 0) return "bg-slate-600";
    if (isTaskValid(count, mn, mx)) return "bg-emerald-400";
    return "bg-amber-400";
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 overflow-hidden">
      {/* Recovery banner */}
      {showRecoveryBanner && (
        <div className="shrink-0 bg-green-600/20 border-b border-green-500/30 px-6 py-2 text-center text-xs font-medium text-green-400">
          Session récupérée avec succès (Sauvegardé localement)
        </div>
      )}

      {/* ── TOP ADMIN BAR ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <div className="flex items-center gap-4 min-w-0">
          <BackButton href="/dashboard/combinations" label="Combinaisons" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate">
              📁 {combination.title}
            </p>
            <p className="text-[10px] text-slate-500">
              {combination.exam_type} Canada · {activeTaskData.label} active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          {/* Cumulative word count */}
          <div className="text-right">
            <p className={`text-sm font-bold ${totalWords >= totalMin ? "text-emerald-400" : "text-slate-300"}`}>
              {totalWords} / {totalMin}
            </p>
            <p className="text-[10px] text-slate-500">mots cumulés</p>
          </div>

          {/* Timer */}
          <div className="text-right">
            <p className={`text-lg font-mono font-bold ${isExpired ? "text-red-400" : "text-slate-100"}`}>
              {timeLeft}
            </p>
            <p className="text-[10px] text-slate-500">temps restant</p>
          </div>

          {/* Save status */}
          <span className="hidden sm:block text-[10px] text-slate-500">
            {saveStatus === "saving"
              ? "Sauvegarde..."
              : saveStatus === "saved"
                ? "✓ Sauvegardé"
                : "Non sauvegardé"}
          </span>
        </div>
      </div>

      {/* ── TASK TABS (full-width, 3-column) ── */}
      <div className="shrink-0 grid grid-cols-3 border-b border-slate-800 bg-slate-900">
        {tasks.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTask(key)}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTask === key
                ? "border-blue-500 text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${tabDotClass(key)}`} />
            {label}
            <span className="text-[10px] font-normal text-slate-500">
              ({wordCounts[key - 1]})
            </span>
          </button>
        ))}
      </div>

      {/* ── QUESTION BLOCK ── */}
      <div className="shrink-0 mx-5 mt-4 mb-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {activeTaskData.label} — Sujet
          </p>
          <p className="text-[10px] text-slate-600">
            {minWords}–{maxWords} mots
          </p>
        </div>
        {/* Copy-protected question text */}
        <div className="select-none pointer-events-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {activeTaskData.task.question}
        </div>
      </div>

      {/* ── EDITOR AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden mx-5 mb-2 rounded-xl border border-slate-800">
        {/* Accent bar */}
        <div className="shrink-0 flex items-center gap-1 border-b border-slate-800 bg-slate-900 px-4 py-2">
          <span className="text-[10px] text-slate-500 mr-1">Accents</span>
          {ACCENTS.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => insertAccent(char)}
              disabled={isLocked || isExpired}
              className="rounded px-2 py-0.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={`Insérer ${char}`}
            >
              {char}
            </button>
          ))}
          <span className={`ml-auto text-xs font-bold ${!isTaskValid(activeWordCount, minWords, maxWords) && activeWordCount > 0 ? "text-amber-400" : activeWordCount === 0 ? "text-slate-600" : "text-emerald-400"}`}>
            {activeWordCount} mots
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={activeDraft}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isLocked || isExpired}
          placeholder="Commencez à rédiger votre réponse ici..."
          className="flex-1 resize-none bg-slate-950 p-5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none disabled:opacity-60 leading-relaxed"
        />
      </div>

      {/* ── FOOTER NAVIGATION ── */}
      <div className="shrink-0 flex items-center justify-between border-t border-slate-800 bg-slate-900 px-5 py-3 gap-3">
        {/* Left: Quit */}
        <button
          onClick={handleQuit}
          disabled={isLocked}
          className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-40"
        >
          Quitter le test
        </button>

        {/* Center: Prev / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(-1)}
            disabled={activeTask === 1 || isLocked}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <button
            onClick={() => goTo(1)}
            disabled={activeTask === 3 || isLocked}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>

        {/* Right: Submit */}
        <Button
          size="sm"
          onClick={() => submitAll()}
          loading={isSubmitting}
          disabled={isLocked}
        >
          🚀 Soumettre mon évaluation
        </Button>
      </div>
    </div>
  );
}
