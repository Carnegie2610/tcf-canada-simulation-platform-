import { PricingCard } from "@/components/molecules/PricingCard";

const tiers = [
  {
    name: "Accès 1 Mois",
    price: "20 000",
    currency: "FCFA",
    duration: "Accès valable 30 jours",
    quota: "35 simulations de rédaction",
    hasAiCorrection: true,
    buttonLabel: "Commencer maintenant",
    isHighlighted: false,
  },
  {
    name: "Accès 2 Mois",
    price: "35 000",
    currency: "FCFA",
    duration: "Accès valable 60 jours",
    quota: "35 simulations de rédaction",
    hasAiCorrection: true,
    buttonLabel: "Choisir cette formule",
    isHighlighted: true,
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

        <div className="mx-auto grid max-w-3xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
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
