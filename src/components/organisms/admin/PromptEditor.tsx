"use client";

import { useState } from "react";
import type { PromptPreset } from "@/lib/ai/prompts";

const PROMPT_META: Record<string, { label: string; description: string }> = {
  tache_1_evaluation: {
    label: "Tâche 1 — Courriel Amical",
    description: "Prompt système pour l'évaluation de la Tâche 1 (courriel amical, noté sur 4 points).",
  },
  tache_2_evaluation: {
    label: "Tâche 2 — Article de Blog",
    description: "Prompt système pour l'évaluation de la Tâche 2 (article de blog, noté sur 7 points).",
  },
  tache_3_evaluation: {
    label: "Tâche 3 — Synthèse & Argumentation",
    description: "Prompt système pour l'évaluation de la Tâche 3 (synthèse et argumentation, notée sur 9 points).",
  },
  single_evaluation: {
    label: "Évaluation Examen Simple",
    description: "Prompt système pour l'évaluation des examens à tâche unique.",
  },
};

interface AiPromptRow {
  prompt_key: string;
  prompt_text: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface PromptEditorProps {
  prompts: AiPromptRow[];
  promptDefaults: Record<string, { default: string; presets: PromptPreset[] }>;
}

interface PromptPanelProps {
  promptKey: string;
  existing: AiPromptRow | undefined;
  defaultConfig: { default: string; presets: PromptPreset[] };
}

function PromptPanel({ promptKey, existing, defaultConfig }: PromptPanelProps) {
  const meta = PROMPT_META[promptKey] ?? { label: promptKey, description: "" };
  const savedText = existing?.prompt_text ?? defaultConfig.default;
  const [text, setText] = useState(savedText);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isDirty = text !== savedText;
  const isUsingDefault = !existing;

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/prompts/${promptKey}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt_text: text }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (data.ok) {
      showToast("Prompt enregistré avec succès.", true);
    } else {
      showToast(`Erreur : ${data.error ?? "inconnue"}`, false);
    }
  }

  async function handleReset() {
    if (!confirm("Réinitialiser ce prompt au défaut du code source ? Le texte personnalisé sera supprimé.")) return;
    setResetting(true);
    const res = await fetch(`/api/admin/prompts/${promptKey}/reset`, { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setResetting(false);
    if (data.ok) {
      setText(defaultConfig.default);
      showToast("Prompt réinitialisé. Le défaut codé est restauré.", true);
    } else {
      showToast(`Erreur : ${data.error ?? "inconnue"}`, false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{meta.label}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isUsingDefault ? (
            <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              DÉFAUT SYSTÈME
            </span>
          ) : (
            <span className="rounded border border-blue-800/50 bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              PERSONNALISÉ
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-900/20 px-3 py-2.5 text-xs text-amber-400">
          <span className="mt-0.5">⚠️</span>
          <span>Modifier ce prompt affecte immédiatement toutes les nouvelles évaluations, sans redéploiement.</span>
        </div>

        {/* Preset loader */}
        {defaultConfig.presets.length > 1 && (
          <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Charger un preset
            </p>
            <div className="flex flex-wrap gap-2">
              {defaultConfig.presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setText(preset.text)}
                  className="rounded border border-slate-600 bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-600 hover:border-slate-500 active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setText("")}
                className="rounded border border-dashed border-slate-500 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:border-blue-500 hover:text-blue-400 active:scale-95"
              >
                + Écrire mon propre prompt
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-600">
              Cliquez pour pré-remplir l&apos;éditeur. Appuyez sur &laquo; Enregistrer &raquo; pour activer.
            </p>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${toast.ok ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-300" : "border-red-700/50 bg-red-900/30 text-red-300"}`}>
            {toast.ok ? "✓" : "✗"} {toast.msg}
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-blue-600 focus:outline-none leading-relaxed"
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-slate-600">
            {text.length.toLocaleString()} caractères
          </div>
        </div>

        {/* Last updated */}
        {existing?.updated_at && (
          <p className="text-[10px] text-slate-600">
            Dernière modification : {new Date(existing.updated_at).toLocaleString("fr-FR")}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={isUsingDefault || resetting}
            className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/30 disabled:opacity-40"
          >
            {resetting ? "Réinitialisation..." : "Réinitialiser au défaut"}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || !text.trim() || saving}
            className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptEditor({ prompts, promptDefaults }: PromptEditorProps) {
  const PROMPT_KEYS = ["tache_1_evaluation", "tache_2_evaluation", "tache_3_evaluation", "single_evaluation"];

  return (
    <div className="space-y-6">
      {PROMPT_KEYS.map((key) => {
        const config = promptDefaults[key] ?? { default: "", presets: [] };
        return (
          <PromptPanel
            key={key}
            promptKey={key}
            existing={prompts.find((p) => p.prompt_key === key)}
            defaultConfig={config}
          />
        );
      })}
    </div>
  );
}
