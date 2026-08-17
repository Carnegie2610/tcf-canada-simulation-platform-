"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface OralTaskRecorderTask {
  question: string;
  prepTimeSeconds: number;
  speakingTimeSeconds: number;
}

interface OralTaskRecorderProps {
  task: OralTaskRecorderTask;
  /** Fired every time a take finishes recording (including re-recordings — the
   * latest call always wins). The parent is the source of truth for "what will
   * actually be submitted". */
  onRecordingComplete: (blob: Blob, mimeType: string) => void;
  /** A previously-recorded take for this task, restored after a remount (e.g. the
   * student switched to another task and came back). When set, the component opens
   * straight into the review/playback screen instead of idle. */
  initialRecording?: { blob: Blob; mimeType: string } | null;
  disabled?: boolean;
}

type Phase = "idle" | "prep" | "recording" | "review";

function PrepCountdown({
  prepTimeSeconds,
  question,
  onComplete,
}: {
  prepTimeSeconds: number;
  question: string;
  onComplete: () => void;
}) {
  const { timeLeft, isExpired } = useExamTimer(prepTimeSeconds / 60);

  useEffect(() => {
    if (isExpired) onComplete();
  }, [isExpired, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/40 p-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
        Préparation
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-200)]">{question}</p>
      <p className="font-mono text-4xl font-bold text-[var(--accent-amber-text)]">{timeLeft}</p>
      <p className="text-xs text-[var(--slate-500)]">
        L&apos;enregistrement démarrera automatiquement à la fin de la préparation.
      </p>
    </div>
  );
}

function RecordingCountdown({
  speakingTimeSeconds,
  onExpire,
}: {
  speakingTimeSeconds: number;
  onExpire: () => void;
}) {
  const { timeLeft, isExpired } = useExamTimer(speakingTimeSeconds / 60);

  useEffect(() => {
    if (isExpired) onExpire();
  }, [isExpired, onExpire]);

  return <p className="font-mono text-4xl font-bold text-[var(--accent-red-text)]">{timeLeft}</p>;
}

export function OralTaskRecorder({
  task,
  onRecordingComplete,
  initialRecording,
  disabled,
}: OralTaskRecorderProps) {
  const recorder = useAudioRecorder();
  const phaseRef = useRef<Phase>("idle");
  const hasStartedRecordingRef = useRef(false);

  // The blob actually shown for playback: either a take just finished this mount
  // (via the "recorder stopped" effect below) or one restored from a prior mount
  // through initialRecording. Kept separate from recorder.audioBlob because the
  // hook has no concept of "restore" — its own state always starts at "idle".
  const [activeBlob, setActiveBlob] = useState<Blob | null>(initialRecording?.blob ?? null);

  // Derive phase from recorder status rather than tracking it separately, except for
  // the "idle" (not yet started) state which recorder.status alone can't express
  // after a reset — recorder.status is "idle" both before the first take and right
  // after a reset-for-re-record, which is exactly the distinction we want here.
  // A restored activeBlob (no fresh take this mount) also opens straight to review.
  const phase: Phase =
    recorder.status === "recording"
      ? "recording"
      : recorder.status === "stopped"
        ? "review"
        : activeBlob
          ? "review"
          : phaseRef.current;
  phaseRef.current = phase;

  function handleStart() {
    if (disabled) return;
    hasStartedRecordingRef.current = false;
    phaseRef.current = "prep";
  }

  function handlePrepComplete() {
    if (!hasStartedRecordingRef.current) {
      hasStartedRecordingRef.current = true;
      recorder.start();
    }
  }

  function handleStopRequested() {
    recorder.stop();
  }

  function handleReRecord() {
    recorder.reset();
    hasStartedRecordingRef.current = false;
    hasHandledCompleteRef.current = null;
    setActiveBlob(null);
    phaseRef.current = "idle";
  }

  const hasHandledCompleteRef = useRef<Blob | null>(null);
  useEffect(() => {
    if (recorder.status === "stopped" && recorder.audioBlob && recorder.mimeType) {
      if (hasHandledCompleteRef.current === recorder.audioBlob) return;
      hasHandledCompleteRef.current = recorder.audioBlob;
      setActiveBlob(recorder.audioBlob);
      onRecordingComplete(recorder.audioBlob, recorder.mimeType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status, recorder.audioBlob, recorder.mimeType]);

  const audioUrl = useMemo(() => {
    if (!activeBlob) return null;
    return URL.createObjectURL(activeBlob);
  }, [activeBlob]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (recorder.status === "permission-denied") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/30 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--accent-red-text)]">Accès au microphone refusé</p>
        <p className="text-xs leading-relaxed text-[var(--accent-red-text)]">
          {recorder.errorMessage ??
            "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur, puis réessayez."}
        </p>
        <button
          type="button"
          onClick={handleReRecord}
          className="rounded-lg bg-[var(--slate-800)] px-4 py-2 text-xs font-semibold text-[var(--slate-200)] hover:bg-[var(--slate-700)]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (recorder.status === "unsupported") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--accent-amber-text)]">
          Enregistrement audio non pris en charge
        </p>
        <p className="text-xs leading-relaxed text-[var(--accent-amber-text)]">
          Votre navigateur ne prend pas en charge l&apos;enregistrement audio requis pour cette
          épreuve. Veuillez utiliser une version récente de Chrome, Edge, Firefox ou Safari.
        </p>
      </div>
    );
  }

  if (recorder.status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/30 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--accent-red-text)]">Erreur d&apos;enregistrement</p>
        <p className="text-xs leading-relaxed text-[var(--accent-red-text)]">
          {recorder.errorMessage ?? "Une erreur inattendue est survenue."}
        </p>
        <button
          type="button"
          onClick={handleReRecord}
          className="rounded-lg bg-[var(--slate-800)] px-4 py-2 text-xs font-semibold text-[var(--slate-200)] hover:bg-[var(--slate-700)]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/40 p-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Prête quand vous l&apos;êtes
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-200)]">
          {task.question}
        </p>
        <p className="text-xs text-[var(--slate-500)]">
          {Math.round(task.prepTimeSeconds / 60) || Math.round(task.prepTimeSeconds)} min de
          préparation, puis {Math.round(task.speakingTimeSeconds / 60) || task.speakingTimeSeconds}{" "}
          min de parole.
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={disabled}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Commencer cette tâche
        </button>
      </div>
    );
  }

  if (phase === "prep") {
    return (
      <PrepCountdown
        prepTimeSeconds={task.prepTimeSeconds}
        question={task.question}
        onComplete={handlePrepComplete}
      />
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/40 p-6 text-center">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-red-text)]">
            Enregistrement en cours
          </p>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-200)]">
          {task.question}
        </p>
        <RecordingCountdown
          speakingTimeSeconds={task.speakingTimeSeconds}
          onExpire={handleStopRequested}
        />
        <button
          type="button"
          onClick={handleStopRequested}
          className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-2.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Terminer
        </button>
      </div>
    );
  }

  // phase === "review": recording stopped, previewable, re-recordable.
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-800/50 bg-[var(--slate-900)]/40 p-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-emerald-text)]">
        Enregistrement terminé
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-200)]">{task.question}</p>
      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={audioUrl} className="w-full max-w-sm" />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReRecord}
          disabled={disabled}
          className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-4 py-2 text-xs font-semibold text-[var(--slate-200)] hover:bg-[var(--slate-700)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réenregistrer
        </button>
      </div>
    </div>
  );
}
