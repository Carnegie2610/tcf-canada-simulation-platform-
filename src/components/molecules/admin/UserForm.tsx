"use client";

import { useState, useEffect, useRef } from "react";
import { CreateUserSchema, UpdateUserSchema } from "@/lib/schemas-admin";
import { SuperAdminSecurityModule } from "./SuperAdminSecurityModule";
import type { AdminProfile, UserRole } from "@/lib/admin/types";
import {
  PLAN_CONFIG as PLANS,
  ADMIN_ONLY_PLAN_CONFIG,
  EO_PLAN_CONFIG,
} from "@/lib/plans";

const NONE_VALUE = "";

interface UserFormProps {
  mode: "create" | "edit";
  initial?: AdminProfile;
  /** Seed values for a brand-new account — used when approving a signup request
   *  so the admin doesn't retype what the student already submitted. */
  prefill?: { full_name?: string; email?: string };
  currentUserRole?: UserRole;
  onSuccess: (profile: AdminProfile) => void;
  onCancel: () => void;
}

function buildPlanOptions(source: typeof PLANS) {
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => {
      const simLabel =
        v.skillType === "mix"
          ? `${v.eeQuota} sim. EE + ${v.eoQuota} sim. EO`
          : v.skillType === "eo"
            ? `${v.eoQuota} sim. EO`
            : `${v.eeQuota} sim. EE`;
      return [
        k,
        {
          label: `${v.label} (${v.price.toLocaleString("fr-FR")} CFA — ${simLabel})`,
          name: v.label,
          price: v.price,
          commission: v.commission,
          eeQuota: v.eeQuota,
          eoQuota: v.eoQuota,
          days: v.days,
        },
      ];
    })
  );
}

const PLAN_CONFIG = buildPlanOptions(PLANS);
const ADMIN_ONLY_PLANS = buildPlanOptions(ADMIN_ONLY_PLAN_CONFIG);
const EO_PLANS = buildPlanOptions(EO_PLAN_CONFIG);
const ALL_EE_PLANS = { ...PLAN_CONFIG, ...ADMIN_ONLY_PLANS };
const ALL_EO_PLANS = { ...EO_PLANS };

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

// Native <select> popups can render off-screen inside this modal on some browsers
// (a Chromium/Linux quirk with native popups anchored inside `position: fixed`
// containers) — a custom-rendered dropdown sidesteps the issue entirely.
function PlanDropdown({
  value,
  onChange,
  groups,
  noneLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  groups: { label: string; options: [string, { label: string }][] }[];
  noneLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedLabel =
    (value === NONE_VALUE ? noneLabel : undefined) ??
    groups.flatMap((g) => g.options).find(([key]) => key === value)?.[1].label ??
    "Sélectionner un plan";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputCls} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="shrink-0 text-[var(--slate-500)]">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] py-1 shadow-2xl">
          {noneLabel && (
            <button
              type="button"
              onClick={() => {
                onChange(NONE_VALUE);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                value === NONE_VALUE
                  ? "bg-[var(--blue-600)]/20 text-blue-300"
                  : "text-[var(--slate-200)] hover:bg-[var(--slate-700)]"
              }`}
            >
              {noneLabel}
            </button>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--slate-500)]">
                {group.label}
              </p>
              {group.options.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                    key === value
                      ? "bg-[var(--blue-600)]/20 text-blue-300"
                      : "text-[var(--slate-200)] hover:bg-[var(--slate-700)]"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserForm({ mode, initial, prefill, currentUserRole, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // On create, pre-select a sensible starter pack. On edit, always mirror what the
  // student actually has — defaulting to a plan here silently granted an EE pack to
  // students who only ever bought an EO one.
  const defaultPlanEe = mode === "create" ? "PLAN_5000" : (initial?.assigned_plan_ee ?? null);
  const defaultCfg = defaultPlanEe ? ALL_EE_PLANS[defaultPlanEe] : null;
  // Staff (admin/super_admin) accounts have no subscription plan — the plan/quota/
  // expiry fields are hidden and kept null for them, matching the DB constraint
  // that only students are required to have a plan.
  const initialIsStaff = (initial?.role ?? "student") !== "student";

  const [form, setForm] = useState<{
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    assigned_plan_ee: string | null;
    assigned_plan_eo: string | null;
    ee_simulations_quota: number | null;
    eo_simulations_quota: number | null;
    ee_simulations_remaining: number | null;
    eo_simulations_remaining: number | null;
    ai_corrections_enabled: boolean;
    expires_at: string | null;
    cohort_tag: string;
    bill_plan_change: boolean;
  }>({
    email: initial?.email ?? prefill?.email ?? "",
    full_name: initial?.full_name ?? prefill?.full_name ?? "",
    password: "",
    role: initial?.role ?? "student",
    assigned_plan_ee: initialIsStaff ? null : defaultPlanEe,
    assigned_plan_eo: initialIsStaff ? null : (initial?.assigned_plan_eo ?? null),
    ee_simulations_quota: initialIsStaff ? null : (initial?.ee_simulations_quota ?? defaultCfg?.eeQuota ?? 0),
    eo_simulations_quota: initialIsStaff ? null : (initial?.eo_simulations_quota ?? 0),
    ee_simulations_remaining: initialIsStaff ? null : (initial?.ee_simulations_remaining ?? defaultCfg?.eeQuota ?? 0),
    eo_simulations_remaining: initialIsStaff ? null : (initial?.eo_simulations_remaining ?? 0),
    ai_corrections_enabled: initial?.ai_corrections_enabled ?? true,
    expires_at: initialIsStaff
      ? null
      : initial?.expires_at
        ? initial.expires_at.substring(0, 10)
        : addDays(defaultCfg?.days ?? 0),
    cohort_tag: initial?.cohort_tag ?? "",
    // Default on: changing a pack is normally a purchase. Unticked for corrections.
    bill_plan_change: true,
  });

  const isStaffRole = form.role !== "student";

  // Only meaningful on edit: has the admin actually moved this student onto a
  // different pack? Drives the "was this paid?" prompt below.
  const eePlanChanged =
    mode === "edit" && form.assigned_plan_ee !== (initial?.assigned_plan_ee ?? null);
  const eoPlanChanged =
    mode === "edit" && form.assigned_plan_eo !== (initial?.assigned_plan_eo ?? null);
  const planChanged = (eePlanChanged || eoPlanChanged) && !isStaffRole;

  const billedPlans = [
    eePlanChanged && form.assigned_plan_ee ? ALL_EE_PLANS[form.assigned_plan_ee] : null,
    eoPlanChanged && form.assigned_plan_eo ? ALL_EO_PLANS[form.assigned_plan_eo] : null,
  ].filter((p): p is NonNullable<typeof p> => p != null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRoleChange(role: string) {
    const nextRole = role as UserRole;
    if (nextRole === "student") {
      setForm((prev) => ({
        ...prev,
        role: nextRole,
        assigned_plan_ee: prev.assigned_plan_ee ?? defaultPlanEe,
        ee_simulations_quota: prev.ee_simulations_quota ?? defaultCfg?.eeQuota ?? 0,
        ee_simulations_remaining: prev.ee_simulations_remaining ?? defaultCfg?.eeQuota ?? 0,
        eo_simulations_remaining: prev.eo_simulations_remaining ?? 0,
        expires_at: prev.expires_at ?? addDays(defaultCfg?.days ?? 0),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        role: nextRole,
        assigned_plan_ee: null,
        assigned_plan_eo: null,
        ee_simulations_quota: null,
        eo_simulations_quota: null,
        ee_simulations_remaining: null,
        eo_simulations_remaining: null,
        expires_at: null,
      }));
    }
  }

  // EE and EO packs can have different validity periods — the account keeps
  // access to whichever quota is still active, so expiry is whichever pack
  // grants the longer period.
  function longerExpiry(eePlan: string | null, eoPlan: string | null): string {
    const eeDays = eePlan ? ALL_EE_PLANS[eePlan]?.days ?? 0 : 0;
    const eoDays = eoPlan ? ALL_EO_PLANS[eoPlan]?.days ?? 0 : 0;
    return addDays(Math.max(eeDays, eoDays));
  }

  // Applies on edit as well as create: previously the edit path only swapped the
  // label and left the quota untouched, so "move this student from 2000 to 5000"
  // renamed their pack without ever granting the simulations they paid for.
  //
  // Changing the pack means a new purchase, so `remaining` is reset to the new
  // pack's full allowance — matching createUser(), and keeping remaining <= quota,
  // which the chk_ee_quota_bounds / chk_eo_quota_bounds constraints require.
  function handleEePlanChange(plan: string) {
    const nextPlan = plan || null;
    const cfg = plan ? ALL_EE_PLANS[plan] : null;
    const quota = cfg?.eeQuota ?? 0;
    setForm((prev) => ({
      ...prev,
      assigned_plan_ee: nextPlan,
      ee_simulations_quota: quota,
      ee_simulations_remaining: quota,
      expires_at: longerExpiry(nextPlan, prev.assigned_plan_eo),
    }));
  }

  function handleEoPlanChange(plan: string) {
    const nextPlan = plan || null;
    const cfg = plan ? ALL_EO_PLANS[plan] : null;
    const quota = cfg?.eoQuota ?? 0;
    setForm((prev) => ({
      ...prev,
      assigned_plan_eo: nextPlan,
      eo_simulations_quota: quota,
      eo_simulations_remaining: quota,
      expires_at: longerExpiry(prev.assigned_plan_ee, nextPlan),
    }));
  }

  // A manually typed quota must not leave `remaining` above it, or the DB rejects
  // the whole save with a raw check-constraint error.
  function setQuota(skill: "ee" | "eo", raw: number) {
    const quota = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    setForm((prev) => {
      const remainingKey = skill === "ee" ? "ee_simulations_remaining" : "eo_simulations_remaining";
      const quotaKey = skill === "ee" ? "ee_simulations_quota" : "eo_simulations_quota";
      return {
        ...prev,
        [quotaKey]: quota,
        [remainingKey]: Math.min(prev[remainingKey] ?? quota, quota),
      };
    });
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
        setError(friendlyError(json.error));
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
              <Field label="Pack Expression Écrite">
                <PlanDropdown
                  value={form.assigned_plan_ee ?? NONE_VALUE}
                  onChange={handleEePlanChange}
                  noneLabel="Aucun pack EE"
                  groups={[
                    // Offered on edit as well as create — hiding them made it
                    // impossible to represent (or restore) a student already on one.
                    { label: "Plans spéciaux", options: Object.entries(ADMIN_ONLY_PLANS) },
                    { label: "Expression Écrite", options: Object.entries(PLAN_CONFIG) },
                  ]}
                />
              </Field>

              <Field label="Pack Expression Orale">
                <PlanDropdown
                  value={form.assigned_plan_eo ?? NONE_VALUE}
                  onChange={handleEoPlanChange}
                  noneLabel="Aucun pack EO"
                  groups={[
                    { label: "Expression Orale", options: Object.entries(EO_PLANS) },
                  ]}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Quota EE (Expression Écrite)">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    required
                    value={form.ee_simulations_quota ?? ""}
                    onChange={(e) => setQuota("ee", Number(e.target.value))}
                    className={inputCls}
                  />
                  {mode === "edit" && (
                    <p className="mt-1 text-[11px] text-[var(--slate-500)]">
                      Restantes : {form.ee_simulations_remaining ?? 0}
                    </p>
                  )}
                </Field>
                <Field label="Quota EO (Expression Orale)">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    required
                    value={form.eo_simulations_quota ?? ""}
                    onChange={(e) => setQuota("eo", Number(e.target.value))}
                    className={inputCls}
                  />
                  {mode === "edit" && (
                    <p className="mt-1 text-[11px] text-[var(--slate-500)]">
                      Restantes : {form.eo_simulations_remaining ?? 0}
                    </p>
                  )}
                </Field>
              </div>

              <Field label="Expiration">
                <input
                  type="date"
                  required={mode === "create"}
                  value={form.expires_at ?? ""}
                  onChange={(e) => set("expires_at", e.target.value)}
                  className={inputCls}
                />
              </Field>

              {/* Shown only when a pack actually changed — a pack change is normally a
                  sale, but corrections and test accounts must not inflate revenue, so
                  it is confirmed rather than assumed. */}
              {planChanged && (
                <div className="space-y-2 rounded-lg border border-amber-700/50 bg-amber-950/20 px-4 py-3">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.bill_plan_change}
                      onChange={(e) => set("bill_plan_change", e.target.checked)}
                      className="mt-0.5 rounded border-[var(--slate-600)] bg-[var(--slate-800)]"
                    />
                    <span className="text-sm text-[var(--slate-200)]">
                      L&apos;étudiant a payé pour ce changement de pack
                    </span>
                  </label>

                  {form.bill_plan_change ? (
                    <div className="space-y-1 pl-6">
                      {billedPlans.map((plan) => (
                        <p key={plan.name} className="text-xs text-[var(--slate-400)]">
                          {plan.name} — encaissé{" "}
                          <span className="font-semibold text-[var(--slate-200)]">
                            {plan.price.toLocaleString("fr-FR")} F
                          </span>
                          , commission{" "}
                          <span className="font-semibold text-emerald-400">
                            {plan.commission.toLocaleString("fr-FR")} F
                          </span>
                        </p>
                      ))}
                      <p className="text-[11px] text-[var(--slate-500)]">
                        Sera enregistré dans la page Commissions.
                      </p>
                    </div>
                  ) : (
                    <p className="pl-6 text-[11px] text-[var(--slate-500)]">
                      Aucun revenu ne sera enregistré (correction, test ou geste commercial).
                    </p>
                  )}
                </div>
              )}
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

/**
 * Postgres check-constraint failures arrive as raw SQL text
 * ("new row for relation \"profiles\" violates check constraint ..."), which is
 * meaningless to an admin. Translate the ones we can actually cause.
 */
function friendlyError(raw: string | undefined): string {
  if (!raw) return "Erreur serveur";
  if (raw.includes("chk_ee_quota_bounds")) {
    return "Le quota EE ne peut pas être inférieur au nombre de simulations EE déjà restantes.";
  }
  if (raw.includes("chk_eo_quota_bounds")) {
    return "Le quota EO ne peut pas être inférieur au nombre de simulations EO déjà restantes.";
  }
  if (raw.includes("chk_students_require_plan")) {
    return "Un compte étudiant doit avoir au moins un pack (EE ou EO), un quota et une date d'expiration.";
  }
  if (raw.includes("profiles_assigned_plan_ee_check") || raw.includes("profiles_assigned_plan_eo_check")) {
    return "Le pack sélectionné n'est pas valide pour cette compétence.";
  }
  return raw;
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
