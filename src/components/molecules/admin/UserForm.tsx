"use client";

import { useState } from "react";
import { CreateUserSchema, UpdateUserSchema } from "@/lib/schemas-admin";
import type { AdminProfile } from "@/lib/admin/types";

interface UserFormProps {
  mode: "create" | "edit";
  initial?: AdminProfile;
  onSuccess: (profile: AdminProfile) => void;
  onCancel: () => void;
}

export function UserForm({ mode, initial, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: initial?.email ?? "",
    full_name: initial?.full_name ?? "",
    password: "",
    role: initial?.role ?? "student",
    assigned_plan: initial?.assigned_plan ?? "PLAN_5000",
    simulations_quota: initial?.simulations_quota ?? 5,
    ai_corrections_enabled: initial?.ai_corrections_enabled ?? false,
    expires_at: initial?.expires_at
      ? initial.expires_at.substring(0, 10)
      : "",
    cohort_tag: initial?.cohort_tag ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : "",
      cohort_tag: form.cohort_tag || null,
    };

    const schema = mode === "create" ? CreateUserSchema : UpdateUserSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
      setError(msgs[0] ?? "Validation échouée");
      return;
    }

    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/users"
          : `/api/admin/users/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = (await res.json()) as { data?: AdminProfile; error?: string };
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
          {mode === "create" ? "Créer un utilisateur" : "Modifier l'utilisateur"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet">
            <input
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={inputCls}
              placeholder="Alice Martin"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required={mode === "create"}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              placeholder="alice@example.com"
            />
          </Field>
          {mode === "create" && (
            <Field label="Mot de passe">
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={inputCls}
                placeholder="Min. 8 caractères"
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rôle">
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value as typeof form.role)}
                className={inputCls}
              >
                <option value="student">Étudiant</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
            <Field label="Plan">
              <select
                value={form.assigned_plan}
                onChange={(e) =>
                  set("assigned_plan", e.target.value as typeof form.assigned_plan)
                }
                className={inputCls}
              >
                <option value="PLAN_5000">5 000 F</option>
                <option value="PLAN_10000">10 000 F</option>
                <option value="PLAN_15000">15 000 F</option>
                <option value="PLAN_20000">20 000 F</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quota simulations">
              <input
                type="number"
                min={1}
                max={500}
                required
                value={form.simulations_quota}
                onChange={(e) => set("simulations_quota", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Expiration">
              <input
                type="date"
                required={mode === "create"}
                value={form.expires_at}
                onChange={(e) => set("expires_at", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Cohorte (optionnel)">
            <input
              value={form.cohort_tag}
              onChange={(e) => set("cohort_tag", e.target.value)}
              className={inputCls}
              placeholder="ex: Janvier2025"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ai_corrections_enabled}
              onChange={(e) => set("ai_corrections_enabled", e.target.checked)}
              className="rounded border-[var(--slate-600)] bg-[var(--slate-800)]"
            />
            <span className="text-sm text-[var(--slate-300)]">
              Corrections IA activées
            </span>
          </label>

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
