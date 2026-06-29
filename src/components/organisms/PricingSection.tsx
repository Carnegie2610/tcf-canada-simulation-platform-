import { PricingCard } from "@/components/molecules/PricingCard";

const tiers = [
  {
    name: "Forfait Découverte",
    price: "5 000",
    currency: "FCFA",
    duration: "1 Mois",
    description: "L'entrée idéale pour commencer avec l'IA.",
    features: [
      "★ 40 simulations d'expression écrite",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
      "Matériaux de préparation (PDFs)",
      "Compréhension orale & écrite",
    ],
    buttonLabel: "Choisir Découverte",
    isHighlighted: false,
    isSecondary: false,
  },
  {
    name: "Forfait Excellence",
    price: "30 000",
    currency: "FCFA",
    duration: "1 Mois",
    description: "L'écosystème complet pour viser les meilleurs scores NCLC.",
    features: [
      "40 simulations d'expression écrite complètes",
      "Simulations d'expression orale",
      "Mentorat personnalisé & cohorte live",
      "Archives d'anciens sujets réels",
      "Compréhension orale & écrite (modules complets)",
    ],
    buttonLabel: "Rejoindre la Cohorte",
    isHighlighted: true,
    isSecondary: false,
  },
  {
    name: "Forfait Standard",
    price: "10 000",
    currency: "FCFA",
    duration: "2 Mois",
    description: "80 simulations avec feedback IA complet sur 2 mois.",
    features: [
      "★ 80 simulations d'expression écrite",
      "Corrections IA détaillées (niveaux CECRL)",
      "Rapports diagnostiques complets",
      "Préparation complète lecture & écoute (PDFs)",
      "Tableau de bord de progression",
    ],
    buttonLabel: "Saisir l'Offre",
    isHighlighted: false,
    isSecondary: true,
    badge: "🔥 MEILLEURE OPTION EN AUTONOMIE",
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 md:grid-cols-3">
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
