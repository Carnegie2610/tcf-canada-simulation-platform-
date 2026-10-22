"use client";

import { useEffect, useState } from "react";

type ExamType = "EE" | "EE_combination" | "EO";

interface LogEntry {
  id: string;
  submission_id: string | null;
  user_id: string | null;
  exam_type: ExamType;
  stage: string;
  provider: string | null;
  error_message: string;
  created_at: string;
  profile: { full_name: string; email: string } | null;
}

const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  EE: "Écrite (legacy)",
  EE_combination: "Écrite (combinaison)",
  EO: "Orale",
};

const FILTERS: Array<{ label: string; value: ExamType | "all" }> = [
  { label: "Tous", value: "all" },
  { label: "Écrite (legacy)", value: "EE" },
  { label: "Écrite (combinaison)", value: "EE_combination" },
  { label: "Orale", value: "EO" },
];

export default function PipelineLogsAdminPage() {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [filter, setFilter] = useState<ExamType | "all">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLogs(null);
    setError(null);
    const qs = filter === "all" ? "" : `?examType=${filter}`;
    fetch(`/api/admin/pipeline-logs${qs}`)
      .then((res) => res.json())
      .then((json: { data?: LogEntry[]; error?: string }) => {
        if (json.error) {
          setError(json.error);
          return;
        }
        setLogs(json.data ?? []);
      })
      .catch(() => setError("Erreur réseau."));
  }, [filter]);

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">
          Journal des erreurs d&apos;évaluation
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Historique des échecs survenus pendant l&apos;évaluation IA des examens écrits et
          oraux — utile pour comprendre une plainte d&apos;étudiant sans attendre qu&apos;il
          décrive le problème.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.value
                ? "border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 text-[var(--accent-red-text)]"
                : "border-[var(--slate-700)] text-[var(--slate-300)] hover:bg-[var(--slate-800)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {logs === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucune erreur enregistrée.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-[10px] font-medium text-[var(--slate-300)]">
                  {EXAM_TYPE_LABEL[log.exam_type]}
                </span>
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  {log.stage}
                </span>
                {log.provider && (
                  <span className="rounded bg-[var(--slate-800)] px-2 py-0.5 text-[10px] font-medium text-[var(--slate-400)]">
                    {log.provider}
                  </span>
                )}
                <span className="ml-auto text-xs text-[var(--slate-500)]">
                  {new Date(log.created_at).toLocaleString("fr-FR")}
                </span>
              </div>

              <p className="mt-2 text-sm text-[var(--slate-300)]">
                {log.profile ? (
                  <>
                    <span className="font-semibold text-[var(--brand-white)]">
                      {log.profile.full_name}
                    </span>{" "}
                    <span className="text-[var(--slate-500)]">({log.profile.email})</span>
                  </>
                ) : (
                  <span className="text-[var(--slate-500)]">Utilisateur inconnu</span>
                )}
                {log.submission_id && (
                  <span className="ml-2 text-xs text-[var(--slate-600)]">
                    submission: {log.submission_id}
                  </span>
                )}
              </p>

              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--slate-800)] p-3 text-xs leading-relaxed text-[var(--slate-300)]">
                {log.error_message}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
