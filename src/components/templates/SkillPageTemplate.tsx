import { SectionLabel } from "@/components/atoms/SectionLabel";
import { Button } from "@/components/atoms/Button";

const CheckIcon = () => (
  <svg
    className="mt-0.5 h-4 w-4 shrink-0 text-[--brand-red]"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

interface FormatItem {
  title: string;
  description: string;
}

interface SkillPageTemplateProps {
  emoji: string;
  title: string;
  intro: string;
  durationLabel: string;
  taskCountLabel: string;
  format: FormatItem[];
  tips: string[];
}

export function SkillPageTemplate({
  emoji,
  title,
  intro,
  durationLabel,
  taskCountLabel,
  format,
  tips,
}: SkillPageTemplateProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <SectionLabel>Épreuve TEF / TCF Canada</SectionLabel>

      <h1 className="mt-6 font-(family-name:--font-sora) text-4xl font-black tracking-tight text-white sm:text-5xl">
        {emoji} {title}
      </h1>

      <p className="mt-6 text-base leading-relaxed text-[--slate-400] sm:text-lg">{intro}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-sm">
        <div className="rounded-xl bg-[--slate-900] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[--slate-500]">Durée</p>
          <p className="mt-1 text-lg font-bold text-white">{durationLabel}</p>
        </div>
        <div className="rounded-xl bg-[--slate-900] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[--slate-500]">Format</p>
          <p className="mt-1 text-lg font-bold text-white">{taskCountLabel}</p>
        </div>
      </div>

      <h2 className="mt-14 font-(family-name:--font-sora) text-2xl font-bold text-white">
        Structure de l&apos;épreuve
      </h2>
      <div className="mt-6 space-y-4">
        {format.map((item) => (
          <div key={item.title} className="rounded-2xl bg-[--slate-900] p-6">
            <h3 className="font-(family-name:--font-sora) text-lg font-bold text-white">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[--slate-400]">{item.description}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-(family-name:--font-sora) text-2xl font-bold text-white">
        Conseils pratiques
      </h2>
      <ul className="mt-6 space-y-3">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm leading-relaxed text-[--slate-400]">
            <CheckIcon />
            {tip}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-[--slate-500]">
        Le format exact (nombre de questions, durée) peut varier selon la version de l&apos;examen —
        vérifiez toujours les spécifications à jour auprès de l&apos;organisme certificateur avant votre
        inscription.
      </p>

      <div className="mt-10">
        <Button variant="primary" size="lg" href="/#tarifs">
          S&apos;entraîner avec Pack Objectif4C2
        </Button>
      </div>
    </div>
  );
}
