import { Icon } from "@/components/atoms/Icon";

const packCards = [
  {
    icon: "📚",
    title: "Pack Objectif4C2",
    description:
      "Exercices officiels des examens 2019-2026, soigneusement sélectionnés pour maximiser vos chances de réussite",
  },
  {
    icon: "🤖",
    title: "Correction IA Avancée",
    description:
      "Intelligence artificielle calibrée sur les critères officiels TCF pour une évaluation précise et instantanée",
  },
  {
    icon: "🎯",
    title: "Simulation Réaliste",
    description:
      "Entraînement avec des entretiens oraux reproduisant fidèlement les conditions d'examen officiel",
  },
  {
    icon: "🚀",
    title: "Préparation Intensive",
    description:
      "Programme complet adapté aux exigences de l'immigration canadienne avec suivi personnalisé",
  },
];

export function PackSection() {
  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[var(--slate-200)]">
            La Collection de Référence pour le TCF Canada
          </h2>
          <p className="mx-auto max-w-xl text-base text-[var(--slate-400)]">
            Pack Objectif4C2 rassemble la collection la plus complète d&apos;exercices TCF
            Canada, enrichie par une intelligence artificielle de pointe pour une préparation
            optimale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packCards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-4 rounded-2xl bg-[var(--slate-900)] p-6 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]"
            >
              <Icon emoji={card.icon} label={card.title} />
              <div className="space-y-2">
                <h3 className="font-(family-name:--font-sora) text-lg font-bold text-[var(--slate-200)]">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--slate-400)]">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
