import Link from "next/link";
import { BackButton } from "@/components/atoms/BackButton";

interface SkillTileProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
}

function SkillTile({ icon, title, description, href, disabled }: SkillTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        {disabled && (
          <span className="inline-flex rounded bg-[var(--slate-800)] px-2 py-0.5 text-xs font-medium text-[var(--slate-500)]">
            Bientôt disponible
          </span>
        )}
      </div>
      <div>
        <h2
          className={`text-base font-semibold transition-colors ${
            disabled
              ? "text-[var(--slate-400)]"
              : "text-[var(--brand-white)] group-hover:text-white"
          }`}
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--slate-400)] leading-snug">{description}</p>
      </div>
      {!disabled && (
        <span className="mt-auto text-xs font-medium text-[var(--blue-500)] group-hover:text-[var(--blue-400)] transition-colors">
          Accéder →
        </span>
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <div
        aria-disabled="true"
        className="group flex flex-col gap-3 rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)]/40 p-6 opacity-60 cursor-not-allowed"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6 hover:border-[var(--slate-600)] hover:bg-[var(--slate-800)] transition-all"
    >
      {content}
    </Link>
  );
}

export default function SimulationPickerPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Espace Simulation
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Choisissez la compétence que vous souhaitez simuler dans les conditions réelles de
          l&apos;examen TEF/TCF Canada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkillTile
          icon="✍️"
          title="Expression Écrite"
          description="Rédigez des lettres, courriels et textes argumentatifs conformes aux critères CECRL."
          href="/dashboard/combinations"
        />
        <SkillTile
          icon="🎤"
          title="Expression Orale"
          description="Préparez vos productions orales : monologue guidé, interaction et point de vue."
          href="/dashboard/expression-orale"
        />
        <SkillTile
          icon="🎧"
          title="Compréhension Orale"
          description="Maîtrisez l'écoute active de dialogues, bulletins d'information et annonces officielles."
          disabled
        />
        <SkillTile
          icon="📖"
          title="Compréhension Écrite"
          description="Analysez des textes administratifs, articles de presse et documents courants."
          disabled
        />
      </div>
    </div>
  );
}
