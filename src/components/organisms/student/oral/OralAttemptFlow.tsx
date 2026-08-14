"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useExamTimer } from "@/hooks/useExamTimer";
import { OralTaskRecorder } from "@/components/organisms/student/oral/OralTaskRecorder";
import type { OralTask, OralTasks } from "@/lib/admin/types";

interface OralAttemptFlowProps {
  oralCombinationId: string;
  submissionId: string;
  tasks: OralTasks;
  /** Overall session duration in minutes (combination.global_duration). */
  globalDurationMinutes: number;
}

type TaskNumber = 1 | 2 | 3;

type FlowPhase = "attempt" | "submitting" | "error" | "done";

const ORAL_RECORDINGS_BUCKET = "oral-recordings";

const TASK_ORDER: { number: TaskNumber; key: keyof OralTasks; label: string }[] = [
  { number: 1, key: "tache_1", label: "Tâche 1" },
  { number: 2, key: "tache_2", label: "Tâche 2" },
  { number: 3, key: "tache_3", label: "Tâche 3" },
];

type Recordings = Partial<Record<TaskNumber, { blob: Blob; mimeType: string }>>;

async function uploadOneTask(
  submissionId: string,
  taskNumber: TaskNumber,
  blob: Blob,
  mimeType: string
): Promise<void> {
  const urlRes = await fetch(`/api/student/oral-submissions/${submissionId}/upload-url`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ taskNumber, mimeType }),
  });

  if (!urlRes.ok) throw new Error("upload_url_failed");

  const { token, path } = (await urlRes.json()) as {
    signedUrl: string;
    token: string;
    path: string;
  };

  const supabase = createSupabaseBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from(ORAL_RECORDINGS_BUCKET)
    .uploadToSignedUrl(path, token, blob, { contentType: mimeType });

  if (uploadError) throw new Error("upload_failed");

  const confirmRes = await fetch(`/api/student/oral-submissions/${submissionId}/upload-url`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ taskNumber, path }),
  });

  if (!confirmRes.ok) throw new Error("confirm_failed");
}

export function OralAttemptFlow({
  oralCombinationId,
  submissionId,
  tasks,
  globalDurationMinutes,
}: OralAttemptFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordings, setRecordings] = useState<Recordings>({});
  const [phase, setPhase] = useState<FlowPhase>("attempt");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  const { timeLeft: globalTimeLeft, isExpired: globalExpired } = useExamTimer(
    globalDurationMinutes
  );

  const currentTaskMeta = TASK_ORDER[currentIndex];
  const currentTask: OralTask = tasks[currentTaskMeta.key];
  const recordedCount = Object.keys(recordings).length;

  const handleSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setPhase("submitting");
    setErrorMessage(null);

    try {
      for (const t of TASK_ORDER) {
        const rec = recordings[t.number];
        if (!rec) continue;
        await uploadOneTask(submissionId, t.number, rec.blob, rec.mimeType);
      }

      const submitRes = await fetch(`/api/student/oral-submissions/${submissionId}`, {
        method: "PATCH",
      });

      if (!submitRes.ok) throw new Error("submit_failed");

      setPhase("done");
      router.push(
        `/dashboard/expression-orale/attempt/${oralCombinationId}/pending?sid=${submissionId}`
      );
    } catch (err) {
      console.error("[OralAttemptFlow] submit error:", err);
      hasSubmittedRef.current = false;
      setErrorMessage(
        "L'envoi de votre examen a échoué. Vérifiez votre connexion et réessayez."
      );
      setPhase("error");
    }
  }, [oralCombinationId, recordings, router, submissionId]);

  // Global timer expiry force-submits whatever has been recorded so far.
  useEffect(() => {
    if (globalExpired && phase === "attempt") {
      void handleSubmit();
    }
  }, [globalExpired, phase, handleSubmit]);

  function handleRecordingComplete(taskNumber: TaskNumber, blob: Blob, mimeType: string) {
    setRecordings((prev) => ({ ...prev, [taskNumber]: { blob, mimeType } }));
  }

  function handleManualSubmit() {
    if (recordedCount < TASK_ORDER.length) {
      const confirmed = window.confirm(
        `Il vous manque ${TASK_ORDER.length - recordedCount} tâche(s) non enregistrée(s). Soumettre quand même ?`
      );
      if (!confirmed) return;
    }
    void handleSubmit();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Temps restant pour l&apos;épreuve
        </p>
        <p className={`font-mono text-lg font-bold ${globalExpired ? "text-red-400" : "text-blue-400"}`}>
          {globalTimeLeft}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {TASK_ORDER.map((t) => (
          <button
            key={t.number}
            type="button"
            onClick={() => setCurrentIndex(t.number - 1)}
            disabled={phase !== "attempt"}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              t.number === currentTaskMeta.number
                ? "bg-blue-600 text-white"
                : recordings[t.number]
                  ? "bg-emerald-900/60 text-emerald-300"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {t.label} {recordings[t.number] ? "✓" : ""}
          </button>
        ))}
      </div>

      {phase === "attempt" && (
        <OralTaskRecorder
          key={currentTaskMeta.number}
          task={currentTask}
          onRecordingComplete={(blob, mimeType) =>
            handleRecordingComplete(currentTaskMeta.number, blob, mimeType)
          }
          initialRecording={recordings[currentTaskMeta.number] ?? null}
        />
      )}

      {phase === "attempt" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-500">
            {recordedCount} / {TASK_ORDER.length} tâche(s) enregistrée(s). Vous pouvez naviguer
            entre les tâches, réécouter et réenregistrer avant de soumettre.
          </p>
          <button
            type="button"
            onClick={handleManualSubmit}
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Soumettre l&apos;examen
          </button>
        </div>
      )}

      {phase === "submitting" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
          <p className="text-sm text-slate-300">Envoi et finalisation de votre examen…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-800/60 bg-red-950/30 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">Échec de l&apos;envoi</p>
          <p className="text-xs leading-relaxed text-red-300">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Réessayer l&apos;envoi
          </button>
        </div>
      )}
    </div>
  );
}
