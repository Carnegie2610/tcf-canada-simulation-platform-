"use client";

import Link from "next/link";

interface QuadrantCardProps {
  href: string;
  icon: string;
  title: string;
  bullets: string[];
  badge?: string;
}

function QuadrantCard({ href, icon, title, bullets, badge }: QuadrantCardProps) {
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
        <ul className="mt-2 space-y-1">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-[var(--slate-400)] leading-snug">
              <span className="mt-0.5 shrink-0 text-[var(--slate-600)]">•</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <span className="mt-auto text-xs font-medium text-[var(--blue-500)] group-hover:text-[var(--blue-400)] transition-colors">
        Accéder →
      </span>
    </Link>
  );
}

const DAILY_CHALLENGES = [
  "Reformulez en registre soutenu : « C'est trop bien, j'adore ce projet. »",
  "Reformulez en registre soutenu : « On va devoir faire gaffe à nos dépenses. »",
  "Reformulez en registre soutenu : « Ce truc marche pas du tout comme prévu. »",
  "Reformulez en registre soutenu : « T'as pas besoin de t'inquiéter pour ça. »",
  "Reformulez en registre soutenu : « Il faut qu'on se bouge pour finir à temps. »",
  "Reformulez en registre soutenu : « Cette idée est vraiment pas top. »",
  "Reformulez en registre soutenu : « Je suis super content de cette décision. »",
];

function DailyChallenge() {
  const today = new Date().getDay();
  const prompt = DAILY_CHALLENGES[today];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex items-start justify-between">
        <span className="text-3xl">⚡</span>
        <span className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          Défi du jour
        </span>
      </div>
      <div>
        <h2 className="text-base font-semibold text-[var(--brand-white)]">
          Défi quotidien
        </h2>
        <p className="mt-2 text-sm text-[var(--slate-400)] leading-relaxed italic">
          &ldquo;{prompt}&rdquo;
        </p>
        <p className="mt-3 text-xs text-[var(--slate-500)]">
          Entraînez-vous à réécrire cette phrase en français soutenu (niveau C1) pour améliorer votre score de lexique.
        </p>
      </div>
    </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuadrantCard
          href="/dashboard/combinations"
          icon="✍️"
          title="Espace de simulation"
          bullets={[
            "Accéder aux combinaisons d'épreuves",
            `${simulationsTotal} sujets disponibles dans votre plan`,
            "Lancer un test blanc de 60 min",
          ]}
          badge={`${simulationsUsed} / ${simulationsTotal}`}
        />
        <QuadrantCard
          href="/dashboard/history"
          icon="📈"
          title="Historique & Progression"
          bullets={[
            "Consulter vos copies d'examen",
            "Consulter les rapports d'évaluation",
            "Étudier les modèles corrigés (C1 / C2)",
          ]}
        />
        <QuadrantCard
          href="/dashboard/library"
          icon="📚"
          title="Bibliothèque de ressources"
          bullets={[
            "Manuels officiels en lecture seule",
            "Fiches de vocabulaire thématique",
            "Modèles de phrases d'évaluation",
          ]}
        />
        <QuadrantCard
          href="/dashboard/billing"
          icon="💳"
          title="Abonnement & Support"
          bullets={[
            "Détails de votre plan d'abonnement",
            "Contacter un superviseur",
            "Signaler un problème technique",
          ]}
        />
      </div>
      <DailyChallenge />
    </div>
  );
}
