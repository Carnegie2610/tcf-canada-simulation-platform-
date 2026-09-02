"use client";

import { useEffect, useState } from "react";
import type { Submission } from "@/lib/admin/types";

type TaskKey = "task1" | "task2" | "task3";

interface OralSubmissionReviewPanelProps {
  submissionId: string;
  oralTasks: NonNullable<Submission["oralTasks"]>;
}

const TASK_LABELS: Record<TaskKey, string> = {
  task1: "Tâche 1",
  task2: "Tâche 2",
  task3: "Tâche 3",
};

export function OralSubmissionReviewPanel({
  submissionId,
  oralTasks,
}: OralSubmissionReviewPanelProps) {
  const [audioUrls, setAudioUrls] = useState<Record<TaskKey, string | null> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/admin/oral-submissions/${submissionId}/audio-url`)
      .then((res) => {
        if (!res.ok) throw new Error("audio_url_fetch_failed");
        return res.json();
      })
      .then((json: Record<TaskKey, string | null>) => {
        if (!cancelled) setAudioUrls(json);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      {(["task1", "task2", "task3"] as const).map((key) => {
        const task = oralTasks[key];
        const audioUrl = audioUrls?.[key] ?? null;

        return (
          <div
            key={key}
            className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--slate-500)]">
              {TASK_LABELS[key]}
            </p>

            {task.question && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--slate-300)] whitespace-pre-wrap">
                {task.question}
              </p>
            )}

            <div className="mt-3">
              {!task.audioPath ? (
                <p className="text-sm italic text-[var(--slate-500)]">Aucun enregistrement.</p>
              ) : loadError ? (
                <p className="text-sm text-red-400">
                  Échec du chargement de l&apos;enregistrement.
                </p>
              ) : !audioUrl ? (
                <p className="text-sm text-[var(--slate-500)]">Chargement de l&apos;audio...</p>
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls src={audioUrl} className="w-full max-w-sm" />
              )}
            </div>

            <div className="mt-3 border-t border-[var(--slate-800)] pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--slate-500)]">
                Transcription
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--slate-400)] whitespace-pre-wrap">
                {task.transcript || "Transcription indisponible."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
