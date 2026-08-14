"use client";

import { useState } from "react";
import { CreateOralCombinationSchema } from "@/lib/schemas-admin";
import type { OralCombination } from "@/lib/admin/types";

type TaskKey = "tache_1" | "tache_2" | "tache_3";

interface TaskState {
  question: string;
  prepTimeSeconds: number;
  speakingTimeSeconds: number;
}

// Fixed to match the real TEF/TCF Expression Orale exam timing — not editable in the
// form (see the disabled prep/speaking inputs below). Only "question" varies per exercise.
const TASK_DEFAULTS: Record<TaskKey, TaskState> = {
  tache_1: { question: "", prepTimeSeconds: 0, speakingTimeSeconds: 120 },
  tache_2: { question: "", prepTimeSeconds: 60, speakingTimeSeconds: 210 },
  tache_3: { question: "", prepTimeSeconds: 0, speakingTimeSeconds: 270 },
};

const TASK_LABELS: Record<TaskKey, string> = {
  tache_1: "Tâche 1",
  tache_2: "Tâche 2",
  tache_3: "Tâche 3",
};

interface OralCombinationFormProps {
  mode: "create" | "edit";
  initial?: OralCombination;
  onSuccess: (combo: OralCombination) => void;
  onCancel: () => void;
}

export function OralCombinationForm({ mode, initial, onSuccess, onCancel }: OralCombinationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [examType, setExamType] = useState<"TEF" | "TCF">(initial?.exam_type ?? "TCF");
  const [globalDuration, setGlobalDuration] = useState(initial?.global_duration ?? 15);
  const [activeTask, setActiveTask] = useState<TaskKey>("tache_1");
  const [tasks, setTasks] = useState<Record<TaskKey, TaskState>>(
    initial
      ? {
          tache_1: { ...TASK_DEFAULTS.tache_1, question: initial.tasks.tache_1.question },
          tache_2: { ...TASK_DEFAULTS.tache_2, question: initial.tasks.tache_2.question },
          tache_3: { ...TASK_DEFAULTS.tache_3, question: initial.tasks.tache_3.question },
        }
      : structuredClone(TASK_DEFAULTS)
  );

  function setTaskField<K extends keyof TaskState>(key: K, value: TaskState[K]) {
    setTasks((prev) => ({
      ...prev,
      [activeTask]: { ...prev[activeTask], [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      exam_type: examType,
      global_duration: globalDuration,
      tasks,
    };

    const parsed = CreateOralCombinationSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldMsgs = Object.values(parsed.error.flatten().fieldErrors).flat();
      const refineMsgs = parsed.error.issues.map((i) => i.message);
      setError(fieldMsgs[0] ?? refineMsgs[0] ?? "Validation échouée");
      return;
    }

    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/oral-combinations"
          : `/api/admin/oral-combinations/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as { data?: OralCombination; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erreur serveur");
        return;
      }
      onSuccess(json.data!);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const t = tasks[activeTask];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-[var(--brand-white)] mb-5">
          {mode === "create" ? "Créer une combinaison orale" : "Modifier la combinaison orale"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Titre">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Combinaison TCF — Expression Orale..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tâche active">
              <select
                value={activeTask}
                onChange={(e) => setActiveTask(e.target.value as TaskKey)}
                className={inputCls}
              >
                {(Object.keys(TASK_LABELS) as TaskKey[]).map((k) => (
                  <option key={k} value={k}>
                    {TASK_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type d'examen">
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as "TEF" | "TCF")}
                className={inputCls}
              >
                <option value="TCF">TCF</option>
                <option value="TEF">TEF</option>
              </select>
            </Field>
          </div>

          <Field label={`Consigne (sujet) — ${TASK_LABELS[activeTask]}`}>
            <textarea
              required
              rows={4}
              value={t.question}
              onChange={(e) => setTaskField("question", e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Décrivez le sujet de l'entretien..."
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Préparation (sec) — fixe">
              <input
                type="number"
                min={0}
                max={120}
                required
                disabled
                readOnly
                title="Temps fixé selon le barème officiel de l'épreuve, non modifiable."
                value={t.prepTimeSeconds}
                className={`${inputCls} cursor-not-allowed opacity-60`}
              />
            </Field>
            <Field label="Temps de parole (sec) — fixe">
              <input
                type="number"
                min={30}
                max={300}
                required
                disabled
                readOnly
                title="Temps fixé selon le barème officiel de l'épreuve, non modifiable."
                value={t.speakingTimeSeconds}
                className={`${inputCls} cursor-not-allowed opacity-60`}
              />
            </Field>
            <Field label="Durée globale (min)">
              <input
                type="number"
                min={1}
                max={60}
                required
                value={globalDuration}
                onChange={(e) => setGlobalDuration(Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm text-[var(--slate-300)] hover:text-[var(--brand-white)] transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors disabled:opacity-50"
            >
              {loading
                ? "Enregistrement..."
                : mode === "create"
                ? "Créer"
                : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[var(--slate-400)]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
