import Link from "next/link";

interface QuadrantCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

function QuadrantCard({ href, icon, title, description, badge }: QuadrantCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6 hover:border-[var(--slate-600)] hover:bg-[var(--slate-800)] transition-all"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        {badge && (
          <span className="inline-flex rounded bg-[var(--blue-600)]/20 px-2 py-0.5 text-xs font-medium text-[var(--blue-500)]">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h2 className="text-base font-semibold text-[var(--brand-white)] group-hover:text-white transition-colors">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--slate-400)] leading-relaxed">{description}</p>
      </div>
      <span className="mt-auto text-xs font-medium text-[var(--blue-500)] group-hover:text-[var(--blue-400)] transition-colors">
        Accéder →
      </span>
    </Link>
  );
}

interface DashboardQuadrantGridProps {
  simulationsUsed: number;
  simulationsTotal: number;
}

export function DashboardQuadrantGrid({
  simulationsUsed,
  simulationsTotal,
}: DashboardQuadrantGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <QuadrantCard
        href="/dashboard/exams"
        icon="✍️"
        title="Portail des simulations"
        description="Accédez au catalogue complet des sujets. Démarrez, reprenez ou consultez vos simulations."
        badge={`${simulationsUsed} / ${simulationsTotal}`}
      />
      <QuadrantCard
        href="/dashboard/history"
        icon="📈"
        title="Historique & Progression"
        description="Visualisez votre trajectoire CECR, consultez vos anciens brouillons et déclenchez les corrections IA."
      />
      <QuadrantCard
        href="/dashboard/library"
        icon="📚"
        title="Bibliothèque de ressources"
        description="Manuels de référence, gabarits de rédaction, listes de vocabulaire et modèles de phrases."
      />
      <QuadrantCard
        href="/dashboard/billing"
        icon="💳"
        title="Facturation & Support"
        description="Suivez votre abonnement, vérifiez votre quota de simulations et contactez le support technique."
      />
    </div>
  );
}
