"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExamTimer } from "@/hooks/useExamTimer";
import { Button } from "@/components/atoms/Button";
import type { Exam } from "@/lib/admin/types";

interface SimulationEditorProps {
  exam: Exam;
  submissionId: string;
  initialDraft: string;
  initialWordCount: number;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function SimulationEditor({
  exam,
  submissionId,
  initialDraft,
  initialWordCount,
}: SimulationEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [wordCount, setWordCount] = useState(initialWordCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { timeLeft, isExpired } = useExamTimer(exam.max_duration);

  const submitDraft = useCallback(
    async (forceDraft?: string) => {
      if (isLocked || isSubmitting) return;
      setIsSubmitting(true);

      const textToSave = forceDraft ?? draft;

      // Final save
      await fetch(`/api/student/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userDraft: textToSave, wordCount: countWords(textToSave) }),
      });

      // Lock submission
      await fetch(`/api/student/submissions/${submissionId}/submit`, {
        method: "POST",
      });

      setIsLocked(true);
      router.push(`/dashboard/history/${submissionId}`);
    },
    [draft, isLocked, isSubmitting, submissionId, router]
  );

  // Auto-submit when timer expires
  useEffect(() => {
    if (isExpired && !isLocked) {
      submitDraft();
    }
  }, [isExpired, isLocked, submitDraft]);

  // Debounced autosave
  function handleChange(value: string) {
    setDraft(value);
    setWordCount(countWords(value));
    setSaveStatus("unsaved");

    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await fetch(`/api/student/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userDraft: value, wordCount: countWords(value) }),
      });
      setSaveStatus("saved");
    }, 30000);
  }

  const isUnderMinWords = wordCount < exam.min_words;

  return (
    <div className="flex h-screen flex-col bg-[var(--slate-950)]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-6 py-3 shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[var(--brand-white)] truncate max-w-xs">
            {exam.title}
          </h1>
          <p className="text-xs text-[var(--slate-500)]">
            {exam.exam_type} · {exam.section.replace("_", " ")}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Word count */}
          <div className="text-right">
            <p
              className={`text-sm font-bold ${isUnderMinWords ? "text-[var(--brand-red)]" : "text-green-400"}`}
            >
              {wordCount} mots
            </p>
            <p className="text-xs text-[var(--slate-500)]">min. {exam.min_words}</p>
          </div>

          {/* Timer */}
          <div className="text-right">
            <p
              className={`text-lg font-mono font-bold ${isExpired ? "text-[var(--brand-red)]" : "text-[var(--brand-white)]"}`}
            >
              {timeLeft}
            </p>
            <p className="text-xs text-[var(--slate-500)]">temps restant</p>
          </div>

          {/* Save status */}
          <span className="text-xs text-[var(--slate-500)]">
            {saveStatus === "saving" ? "Sauvegarde..." : saveStatus === "saved" ? "Sauvegardé" : "Non sauvegardé"}
          </span>

          {/* Submit */}
          <Button
            size="sm"
            onClick={() => submitDraft()}
            loading={isSubmitting}
            disabled={isLocked}
          >
            Soumettre mon évaluation
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Prompt */}
        <div className="w-1/2 overflow-y-auto border-r border-[var(--slate-800)] bg-[var(--slate-900)] p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Sujet
          </h2>
          <div className="prose prose-invert prose-sm max-w-none text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
            {exam.prompt_text}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="flex w-1/2 flex-col">
          <div className="border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-4 py-2">
            <p className="text-xs text-[var(--slate-500)]">Votre réponse</p>
          </div>
          <textarea
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isLocked || isExpired}
            placeholder="Commencez à rédiger votre réponse ici..."
            className="flex-1 resize-none bg-[var(--slate-950)] p-6 text-sm text-[var(--slate-200)] placeholder-[var(--slate-700)] focus:outline-none disabled:opacity-60 leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
