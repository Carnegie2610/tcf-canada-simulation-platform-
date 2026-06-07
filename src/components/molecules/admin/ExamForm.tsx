"use client";

import { useState } from "react";
import { CreateExamSchema, UpdateExamSchema } from "@/lib/schemas-admin";
import type { Exam } from "@/lib/admin/types";

interface ExamFormProps {
  mode: "create" | "edit";
  initial?: Exam;
  onSuccess: (exam: Exam) => void;
  onCancel: () => void;
}

export function ExamForm({ mode, initial, onSuccess, onCancel }: ExamFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    section: initial?.section ?? "SECTION_A",
    exam_type: initial?.exam_type ?? "TEF",
    prompt_text: initial?.prompt_text ?? "",
    min_words: initial?.min_words ?? 150,
    max_duration: initial?.max_duration ?? 60,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const schema = mode === "create" ? CreateExamSchema : UpdateExamSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
      setError(msgs[0] ?? "Validation échouée");
      return;
    }

    setLoading(true);
    try {
      const url =
        mode === "create" ? "/api/admin/exams" : `/api/admin/exams/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = (await res.json()) as { data?: Exam; error?: string };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-[var(--brand-white)] mb-5">
          {mode === "create" ? "Créer une question" : "Modifier la question"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Titre">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Sujet de production écrite..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Section">
              <select
                value={form.section}
                onChange={(e) => set("section", e.target.value as typeof form.section)}
                className={inputCls}
              >
                <option value="SECTION_A">Section A</option>
                <option value="SECTION_B">Section B</option>
              </select>
            </Field>
            <Field label="Type d'examen">
              <select
                value={form.exam_type}
                onChange={(e) => set("exam_type", e.target.value as typeof form.exam_type)}
                className={inputCls}
              >
                <option value="TEF">TEF</option>
                <option value="TCF">TCF</option>
              </select>
            </Field>
          </div>
          <Field label="Consigne (sujet)">
            <textarea
              required
              rows={5}
              value={form.prompt_text}
              onChange={(e) => set("prompt_text", e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Rédigez un texte argumentatif sur..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mots minimum">
              <input
                type="number"
                min={50}
                max={1000}
                required
                value={form.min_words}
                onChange={(e) => set("min_words", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Durée max (min)">
              <input
                type="number"
                min={5}
                max={180}
                required
                value={form.max_duration}
                onChange={(e) => set("max_duration", Number(e.target.value))}
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
              {loading ? "Enregistrement..." : mode === "create" ? "Créer" : "Mettre à jour"}
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
