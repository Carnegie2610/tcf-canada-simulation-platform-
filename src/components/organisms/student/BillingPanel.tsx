import { SupportTicketForm } from "@/components/molecules/student/SupportTicketForm";
import type { AdminProfile } from "@/lib/admin/types";

interface BillingPanelProps {
  profile: AdminProfile;
}

const planLabel: Record<string, string> = {
  PLAN_5000: "Plan 5 000",
  PLAN_10000: "Plan 10 000",
  PLAN_15000: "Plan 15 000",
  PLAN_20000: "Plan 20 000",
};

export function BillingPanel({ profile }: BillingPanelProps) {
  const used = profile.simulations_quota - profile.simulations_remaining;
  const pct =
    profile.simulations_quota > 0
      ? Math.min(100, (used / profile.simulations_quota) * 100)
      : 0;
  const isExpired = new Date(profile.expires_at) < new Date();

  const expiryDate = new Date(profile.expires_at).toLocaleDateString("fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
                {planLabel[profile.assigned_plan] ?? profile.assigned_plan}
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

          {/* Quota bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--slate-400)]">Simulations utilisées</span>
              <span className="text-sm font-semibold text-[var(--brand-white)]">
                {used} / {profile.simulations_quota}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--slate-800)]">
              <div
                className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-[var(--brand-red)]" : "bg-[var(--blue-500)]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--slate-600)]">
              {profile.simulations_remaining} simulation{profile.simulations_remaining !== 1 ? "s" : ""} restante{profile.simulations_remaining !== 1 ? "s" : ""}
            </p>
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
