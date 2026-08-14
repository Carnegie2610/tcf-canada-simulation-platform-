"use client";

import { useState } from "react";
import { CreateUserSchema, UpdateUserSchema } from "@/lib/schemas-admin";
import { SuperAdminSecurityModule } from "./SuperAdminSecurityModule";
import type { AdminProfile, UserRole } from "@/lib/admin/types";
import { PLAN_CONFIG as PLANS, ADMIN_ONLY_PLAN_CONFIG } from "@/lib/plans";

interface UserFormProps {
  mode: "create" | "edit";
  initial?: AdminProfile;
  currentUserRole?: UserRole;
  onSuccess: (profile: AdminProfile) => void;
  onCancel: () => void;
}

function buildPlanOptions(source: typeof PLANS) {
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => [
      k,
      {
        label: `${v.label} (${v.price.toLocaleString("fr-FR")} CFA — ${v.quota} sim.)`,
        quota: v.quota,
        days: v.days,
      },
    ])
  );
}

const PLAN_CONFIG = buildPlanOptions(PLANS);
const ADMIN_ONLY_PLANS = buildPlanOptions(ADMIN_ONLY_PLAN_CONFIG);

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function UserForm({ mode, initial, currentUserRole, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const defaultPlan = initial?.assigned_plan ?? "PLAN_5000";
  const defaultCfg = PLAN_CONFIG[defaultPlan];
  // Staff (admin/super_admin) accounts have no subscription plan — the plan/quota/
  // expiry fields are hidden and kept null for them, matching the DB constraint
  // that only students are required to have a plan.
  const initialIsStaff = (initial?.role ?? "student") !== "student";

  const [form, setForm] = useState<{
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    assigned_plan: string | null;
    simulations_quota: number | null;
    ai_corrections_enabled: boolean;
    expires_at: string | null;
    cohort_tag: string;
  }>({
    email: initial?.email ?? "",
    full_name: initial?.full_name ?? "",
    password: "",
    role: initial?.role ?? "student",
    assigned_plan: initialIsStaff ? null : defaultPlan,
    simulations_quota: initialIsStaff ? null : (initial?.simulations_quota ?? defaultCfg.quota),
    ai_corrections_enabled: initial?.ai_corrections_enabled ?? true,
    expires_at: initialIsStaff
      ? null
      : initial?.expires_at
        ? initial.expires_at.substring(0, 10)
        : addDays(defaultCfg.days),
    cohort_tag: initial?.cohort_tag ?? "",
  });

  const isStaffRole = form.role !== "student";

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRoleChange(role: string) {
    const nextRole = role as UserRole;
    if (nextRole === "student") {
      setForm((prev) => ({
        ...prev,
        role: nextRole,
        assigned_plan: prev.assigned_plan ?? defaultPlan,
        simulations_quota: prev.simulations_quota ?? defaultCfg.quota,
        expires_at: prev.expires_at ?? addDays(defaultCfg.days),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        role: nextRole,
        assigned_plan: null,
        simulations_quota: null,
        expires_at: null,
      }));
    }
  }

  function handlePlanChange(plan: string) {
    if (mode !== "create") {
      set("assigned_plan", plan);
      return;
    }
    const cfg = PLAN_CONFIG[plan] ?? ADMIN_ONLY_PLANS[plan];
    setForm((prev) => ({
      ...prev,
      assigned_plan: plan,
      simulations_quota: cfg.quota,
      expires_at: addDays(cfg.days),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
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
          {mode === "create" ? "Créer un compte étudiant" : "Modifier l'utilisateur"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet">
            <input
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={inputCls}
              placeholder="Jean Dupont"
            />
          </Field>
          <Field label="Adresse e-mail">
            <input
              type="email"
              required={mode === "create"}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              placeholder="jean.dupont@email.com"
            />
          </Field>
          {mode === "create" && (
            <Field label="Mot de passe">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={`${inputCls} pr-10`}
                  placeholder="Min. 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--slate-500)] hover:text-[var(--slate-300)] transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Masquer" : "Afficher"}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </Field>
          )}

          <Field label="Rôle">
            <select
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className={inputCls}
            >
              <option value="student">Étudiant</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </Field>

          {isStaffRole ? (
            <p className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/40 px-4 py-3 text-xs text-[var(--slate-500)]">
              Les comptes Admin et Super Admin n&apos;ont pas de plan d&apos;abonnement — ce compte
              n&apos;est concerné ni par un quota de simulations ni par une date d&apos;expiration.
            </p>
          ) : (
            <>
              <Field label="Plan de tarification">
                <select
                  value={form.assigned_plan ?? ""}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className={inputCls}
                >
                  {mode === "create" && (
                    <optgroup label="Plans spéciaux">
                      {Object.entries(ADMIN_ONLY_PLANS).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Plans standards">
                    {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </optgroup>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Quota simulations">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={form.simulations_quota ?? ""}
                    onChange={(e) => set("simulations_quota", Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Expiration">
                  <input
                    type="date"
                    required={mode === "create"}
                    value={form.expires_at ?? ""}
                    onChange={(e) => set("expires_at", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </>
          )}

          <Field label="Cohorte (optionnel)">
            <input
              value={form.cohort_tag}
              onChange={(e) => set("cohort_tag", e.target.value)}
              className={inputCls}
              placeholder="ex: Janvier2025"
            />
          </Field>

          {/* Options d'accès */}
          <div className="space-y-2 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/40 px-4 py-3">
            <p className="text-xs font-semibold text-[var(--slate-400)] uppercase tracking-wider">
              Options d&apos;accès
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ai_corrections_enabled}
                onChange={(e) => set("ai_corrections_enabled", e.target.checked)}
                className="rounded border-[var(--slate-600)] bg-[var(--slate-800)]"
              />
              <span className="text-sm text-[var(--slate-300)]">
                Activer les évaluations par IA <span className="text-[var(--slate-500)]">(Recommandé)</span>
              </span>
            </label>
          </div>

          {/* Super Admin security module — edit mode only */}
          {mode === "edit" && initial && (
            currentUserRole === "super_admin" ? (
              <SuperAdminSecurityModule userId={initial.id} userEmail={initial.email} />
            ) : (
              <div className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/40 px-4 py-3 text-xs text-[var(--slate-500)]">
                🔒 Modification des identifiants réservée à l&apos;Administrateur Principal.
              </div>
            )
          )}

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
