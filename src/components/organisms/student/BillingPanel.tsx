import { SupportTicketForm } from "@/components/molecules/student/SupportTicketForm";
import { SignOutButton } from "@/components/molecules/student/SignOutButton";
import type { AdminProfile } from "@/lib/admin/types";
import { getPlanMeta } from "@/lib/plans";

interface BillingPanelProps {
  profile: AdminProfile;
}

function QuotaBar({ label, quota, remaining }: { label: string; quota: number; remaining: number }) {
  const used = quota - remaining;
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--slate-400)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--brand-white)]">
          {used} / {quota}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--slate-800)]">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-[var(--brand-red)]" : "bg-[var(--blue-500)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--slate-600)]">
        {remaining} simulation{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function BillingPanel({ profile }: BillingPanelProps) {
  // This panel is only ever rendered for the logged-in student's own profile, which
  // always has a plan — the DB enforces this (chk_students_require_plan). The
  // fallbacks below only exist to satisfy AdminProfile's shared nullable typing
  // (staff accounts have no plan) and are never hit in practice here.
  const eeQuota = profile.ee_simulations_quota ?? 0;
  const eeRemaining = profile.ee_simulations_remaining ?? 0;
  const eoQuota = profile.eo_simulations_quota ?? 0;
  const eoRemaining = profile.eo_simulations_remaining ?? 0;
  const isExpired = profile.expires_at ? new Date(profile.expires_at) < new Date() : false;

  const expiryDate = profile.expires_at
    ? new Date(profile.expires_at).toLocaleDateString("fr-CA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-8">
      {/* Plan status */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Statut de l&apos;abonnement
        </h2>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-[var(--brand-white)]">
                {profile.assigned_plan ? getPlanMeta(profile.assigned_plan).label : "—"}
              </p>
              <p className="text-sm text-[var(--slate-400)] mt-0.5">
                Expire le {expiryDate}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isExpired
                  ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)]"
                  : "bg-green-900/30 text-green-400"
              }`}
            >
              {isExpired ? "Expiré" : "Actif"}
            </span>
          </div>

          {/* Quota bars — EE and EO tracked independently */}
          <div className="space-y-4">
            <QuotaBar label="Simulations EE utilisées" quota={eeQuota} remaining={eeRemaining} />
            <QuotaBar label="Simulations EO utilisées" quota={eoQuota} remaining={eoRemaining} />
          </div>

          {/* AI corrections */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--slate-800)]">
            <span
              className={`h-2 w-2 rounded-full ${profile.ai_corrections_enabled ? "bg-green-400" : "bg-[var(--slate-600)]"}`}
            />
            <span className="text-xs text-[var(--slate-400)]">
              Corrections IA : {profile.ai_corrections_enabled ? "Activées" : "Désactivées"}
            </span>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Compte
        </h2>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-4 flex items-center justify-between">
          <p className="text-sm text-[var(--slate-400)]">
            Se déconnecter de votre session.
          </p>
          <SignOutButton />
        </div>
      </section>

      {/* Support */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Support technique
        </h2>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6">
          <p className="mb-4 text-sm text-[var(--slate-400)]">
            Vous avez un problème technique, une question sur votre abonnement ou besoin d&apos;aide avec le contenu pédagogique ?
            Envoyez-nous un message et nous vous répondrons dans les plus brefs délais.
          </p>
          <SupportTicketForm />
        </div>
      </section>
    </div>
  );
}
