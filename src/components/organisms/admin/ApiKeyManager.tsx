"use client";

import { useEffect, useState, useCallback } from "react";

const PROVIDERS = [
  { id: "groq", label: "Groq", model: "Llama 3.3 70B", key: "GROQ_API_KEY", badge: "bg-orange-900/40 text-orange-300 border-orange-700/40" },
  { id: "gemini", label: "Google Gemini", model: "Gemini 2.5 Flash", key: "GEMINI_API_KEY", badge: "bg-blue-900/40 text-blue-300 border-blue-700/40" },
  { id: "openai", label: "OpenAI", model: "GPT-4o Mini", key: "OPENAI_API_KEY", badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
  { id: "anthropic", label: "Anthropic", model: "Claude Sonnet 4.6", key: "ANTHROPIC_API_KEY", badge: "bg-purple-900/40 text-purple-300 border-purple-700/40" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

interface EnvStatus {
  configured: boolean;
  envId: string | null;
  isDecryptable: boolean;
}

interface ProviderDetail {
  total: number;
  success: number;
  failed: number;
  models: Record<string, number>;
  avgDurationMs: number | null;
}

interface UsageData {
  byProvider: Record<string, number>;
  providerDetails: Record<string, ProviderDetail>;
  totalSuccess: number;
  totalFailed: number;
  total: number;
}

interface VercelStatus {
  configured: boolean;
  status: Record<string, EnvStatus>;
  activeProvider: string | null;
}

export function ApiKeyManager() {
  const [vercelStatus, setVercelStatus] = useState<VercelStatus | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<string>("");
  const [settingActive, setSettingActive] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [hasDeployHook, setHasDeployHook] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/admin/vercel/env");
    const data = (await res.json()) as VercelStatus & { error?: string };
    if (data.configured) {
      setVercelStatus(data);
      setActiveInput(data.activeProvider ?? "");
      // Fetch masked values for all configured keys
      const configuredKeys = PROVIDERS.map((p) => p.key).filter((k) => data.status?.[k]?.configured);
      const entries = await Promise.all(
        configuredKeys.map(async (k) => {
          const r = await fetch(`/api/admin/vercel/env/${k}`);
          if (!r.ok) return [k, null] as [string, string | null];
          const d = (await r.json()) as { masked?: string };
          return [k, d.masked ?? null] as [string, string | null];
        })
      );
      setMaskedKeys(
        Object.fromEntries(entries.filter((e): e is [string, string] => e[1] !== null))
      );
    } else {
      setVercelStatus({ configured: false, status: {}, activeProvider: null });
    }
  }, []);

  const loadUsage = useCallback(async () => {
    const res = await fetch("/api/admin/usage");
    if (res.ok) {
      setUsage((await res.json()) as UsageData);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadUsage();
    // Check if deploy hook exists by attempting a dry-run check (we just try GET usage)
    fetch("/api/admin/vercel/redeploy", { method: "POST" }).then(async (r) => {
      const d = (await r.json()) as { error?: string };
      setHasDeployHook(!d.error || d.error !== "no_hook_configured");
    }).catch(() => {});

    const interval = setInterval(loadUsage, 60_000);
    return () => clearInterval(interval);
  }, [loadStatus, loadUsage]);

  async function handleSaveKey(providerKey: string) {
    const value = keyInputs[providerKey]?.trim();
    if (!value) return;
    setSaving(providerKey);
    const res = await fetch("/api/admin/vercel/env", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: providerKey, value }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setSaving(null);
    if (data.ok) {
      setKeyInputs((prev) => ({ ...prev, [providerKey]: "" }));
      setPendingChanges(true);
      showToast(`${providerKey} enregistré sur Vercel.`, true);
      await loadStatus();
    } else {
      showToast(`Erreur : ${data.error ?? "inconnue"}`, false);
    }
  }

  async function handleDelete(providerKey: string) {
    setDeleting(providerKey);
    const res = await fetch(`/api/admin/vercel/env/${providerKey}`, { method: "DELETE" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setDeleting(null);
    if (data.ok) {
      setPendingChanges(true);
      showToast(`${providerKey} supprimé.`, true);
      await loadStatus();
    } else {
      showToast(`Erreur suppression : ${data.error ?? "inconnue"}`, false);
    }
  }

  async function handleSetActive() {
    if (!activeInput) return;
    setSettingActive(true);
    const res = await fetch("/api/admin/vercel/env", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "ACTIVE_AI_PROVIDER", value: activeInput }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setSettingActive(false);
    if (data.ok) {
      setPendingChanges(true);
      showToast(`Fournisseur actif défini : ${activeInput}`, true);
      await loadStatus();
    } else {
      showToast(`Erreur : ${data.error ?? "inconnue"}`, false);
    }
  }

  async function handleRedeploy() {
    setRedeploying(true);
    const res = await fetch("/api/admin/vercel/redeploy", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setRedeploying(false);
    if (data.ok) {
      setPendingChanges(false);
      showToast("Redéploiement déclenché avec succès.", true);
    } else {
      showToast(`Erreur redéploiement : ${data.error ?? "inconnue"}`, false);
    }
  }

  const notConfigured = !vercelStatus?.configured;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl transition-all ${toast.ok ? "border-emerald-700/50 bg-emerald-900/80 text-emerald-200" : "border-red-700/50 bg-red-900/80 text-red-200"}`}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Vercel not configured banner */}
      {notConfigured && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 p-4 text-sm text-amber-300">
          <strong>Vercel non configuré.</strong> Ajoutez <code className="mx-1 rounded bg-amber-950/60 px-1">VERCEL_TOKEN</code> et <code className="mx-1 rounded bg-amber-950/60 px-1">VERCEL_PROJECT_ID</code> dans votre <code className="mx-1 rounded bg-amber-950/60 px-1">.env.local</code> (et sur Vercel) pour activer la gestion des clés.
        </div>
      )}

      {/* Pending changes banner */}
      {pendingChanges && (
        <div className="flex items-center justify-between rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3">
          <p className="text-sm text-amber-300">⚠️ Des modifications ont été enregistrées sur Vercel. Un redéploiement est nécessaire pour les activer.</p>
          {hasDeployHook && (
            <button
              onClick={handleRedeploy}
              disabled={redeploying}
              className="ml-4 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
            >
              {redeploying ? "Redéploiement..." : "🚀 Redéployer maintenant"}
            </button>
          )}
        </div>
      )}

      {/* Active Provider Selector */}
      <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/60 p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">Fournisseur actif</h2>
        <div className="flex flex-wrap items-center gap-3">
          {PROVIDERS.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="active_provider"
                value={p.id}
                checked={activeInput === p.id}
                onChange={() => setActiveInput(p.id)}
                className="accent-blue-500"
              />
              <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${p.badge}`}>{p.label}</span>
            </label>
          ))}
          <button
            onClick={handleSetActive}
            disabled={!activeInput || settingActive || notConfigured}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {settingActive ? "Enregistrement..." : "Définir actif"}
          </button>
          {vercelStatus?.activeProvider && (
            <span className="text-xs text-[var(--slate-500)]">
              Actuel sur Vercel : <span className="font-semibold text-[var(--slate-200)]">{vercelStatus.activeProvider}</span>
            </span>
          )}
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const envStatus = vercelStatus?.status?.[p.key];
          const isConfigured = envStatus?.configured ?? false;
          const isSaving = saving === p.key;
          const isDeleting = deleting === p.key;
          const callCount = usage?.byProvider?.[p.id] ?? 0;

          return (
            <div key={p.id} className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/50 p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isConfigured ? "bg-emerald-400" : "bg-red-500"}`} />
                    <h3 className="text-sm font-bold text-[var(--slate-200)]">{p.label}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--slate-500)]">{p.model}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold ${isConfigured ? "text-emerald-500" : "text-red-500"}`}>
                    {isConfigured ? "Configuré" : "Non configuré"}
                  </span>
                  <p className="mt-0.5 text-[10px] text-[var(--slate-500)]">{callCount} appels (30j)</p>
                  {isConfigured && maskedKeys[p.key] && (
                    <p className="mt-1 font-mono text-[10px] text-[var(--slate-500)] tracking-wider">
                      {maskedKeys[p.key]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder={isConfigured ? "••••••••••••••• (remplacer)" : "Entrer la clé API..."}
                  value={keyInputs[p.key] ?? ""}
                  onChange={(e) => setKeyInputs((prev) => ({ ...prev, [p.key]: e.target.value }))}
                  disabled={notConfigured}
                  className="w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/60 px-3 py-2 text-xs text-[var(--slate-200)] placeholder-[var(--slate-500)] focus:border-blue-600 focus:outline-none disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveKey(p.key)}
                    disabled={!keyInputs[p.key]?.trim() || isSaving || notConfigured}
                    className="flex-1 rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : "Enregistrer sur Vercel"}
                  </button>
                  {isConfigured && (
                    <button
                      onClick={() => handleDelete(p.key)}
                      disabled={isDeleting || notConfigured}
                      className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Supprimer"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage summary */}
      {usage && (
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/50 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">Statistiques d&apos;utilisation — 30 derniers jours</h2>
            <button
              onClick={loadUsage}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--slate-700)] px-2.5 py-1 text-[10px] font-semibold text-[var(--slate-400)] transition hover:bg-[var(--slate-800)] hover:text-[var(--slate-200)]"
            >
              🔄 Actualiser
            </button>
          </div>

          {/* Global totals */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-[var(--slate-800)]/50 p-3 text-center">
              <p className="text-2xl font-extrabold text-[var(--slate-200)]">{usage.total}</p>
              <p className="text-[10px] text-[var(--slate-500)] uppercase tracking-wider">Total appels</p>
            </div>
            <div className="rounded-lg bg-emerald-900/20 p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-400">{usage.totalSuccess}</p>
              <p className="text-[10px] text-[var(--slate-500)] uppercase tracking-wider">Succès</p>
            </div>
            <div className="rounded-lg bg-red-900/20 p-3 text-center">
              <p className="text-2xl font-extrabold text-red-400">{usage.totalFailed}</p>
              <p className="text-[10px] text-[var(--slate-500)] uppercase tracking-wider">Échecs</p>
            </div>
            <div className="rounded-lg bg-[var(--slate-800)]/50 p-3 text-center">
              <p className="text-2xl font-extrabold text-[var(--slate-200)]">
                {usage.total > 0 ? Math.round((usage.totalSuccess / usage.total) * 100) : 0}%
              </p>
              <p className="text-[10px] text-[var(--slate-500)] uppercase tracking-wider">Taux succès</p>
            </div>
          </div>

          {/* Per-provider breakdown */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">Détail par fournisseur</p>
            <div className="overflow-x-auto rounded-lg border border-[var(--slate-800)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--slate-800)]/60">
                  <tr>
                    {["Fournisseur", "Modèle utilisé", "Appels", "Succès", "Échecs", "Taux", "Durée moy."].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--slate-500)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((p) => {
                    const d = usage.providerDetails?.[p.id];
                    if (!d || d.total === 0) {
                      return (
                        <tr key={p.id} className="border-t border-[var(--slate-800)]/60">
                          <td className="px-3 py-2.5">
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${p.badge}`}>{p.label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--slate-500)]" colSpan={6}>Aucun appel</td>
                        </tr>
                      );
                    }
                    const topModel = Object.entries(d.models).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
                    const rate = d.total > 0 ? Math.round((d.success / d.total) * 100) : 0;
                    return (
                      <tr key={p.id} className="border-t border-[var(--slate-800)]/60 hover:bg-[var(--slate-800)]/20">
                        <td className="px-3 py-2.5">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${p.badge}`}>{p.label}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-[var(--slate-400)]">{topModel}</td>
                        <td className="px-3 py-2.5 font-bold text-[var(--slate-200)]">{d.total}</td>
                        <td className="px-3 py-2.5 text-emerald-400">{d.success}</td>
                        <td className="px-3 py-2.5 text-red-400">{d.failed}</td>
                        <td className="px-3 py-2.5">
                          <span className={`font-semibold ${rate >= 90 ? "text-emerald-400" : rate >= 70 ? "text-amber-400" : "text-red-400"}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[var(--slate-500)]">
                          {d.avgDurationMs != null ? `${(d.avgDurationMs / 1000).toFixed(1)}s` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-right text-[10px] text-[var(--slate-500)]">
              Mis à jour : {lastUpdated.toLocaleTimeString("fr-FR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
