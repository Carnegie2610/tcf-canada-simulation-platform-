import { PricingCard } from "@/components/molecules/PricingCard";

const tiers = [
  {
    name: "Plan de Base",
    price: "5 000",
    currency: "FCFA",
    description: "40 Sujets d'entraînement + Solutions d'examens rédigées",
    features: [
      "40 Sujets d'entraînement",
      "Solutions d'examens rédigées",
      "Accès simulateur Tâche 1, 2 et 3",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
    ],
    buttonLabel: "S'inscrire",
    isHighlighted: false,
  },
  {
    name: "Plan Pro / Premium",
    price: "10 000",
    currency: "FCFA",
    description: "80 Sujets d'entraînement + Solutions d'examens rédigées",
    features: [
      "80 Sujets d'entraînement",
      "Solutions d'examens rédigées",
      "Accès simulateur Tâche 1, 2 et 3",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
      "Tableau de bord de progression",
    ],
    buttonLabel: "Choisir ce plan",
    isHighlighted: true,
  },
  {
    name: "Plan Élite / VIP",
    price: "3 000",
    currency: "FCFA",
    description: "120 Sujets d'entraînement + Solutions d'examens rédigées",
    features: [
      "120 Sujets d'entraînement",
      "Solutions d'examens rédigées",
      "Accès simulateur Tâche 1, 2 et 3",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
      "Tableau de bord de progression",
    ],
    buttonLabel: "Choisir ce plan",
    isHighlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="tarifs" className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-white">
            Choisissez votre formule
          </h2>
          <p className="mx-auto max-w-xl text-base text-[--slate-400]">
            Un accès complet aux simulations TEF/TCF Canada avec corrections personnalisées
            par intelligence artificielle.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        <div className="secure-canvas-wrapper text-center">
          <p className="text-xs text-[--slate-500]">
            Les contenus pédagogiques et corrigés sont protégés. Toute reproduction est interdite.
          </p>
        </div>
      </div>
    </section>
  );
}
