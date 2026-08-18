import { PricingCard } from "@/components/molecules/PricingCard";

const tiers = [
  {
    name: "Forfait Essentiel",
    price: "2 000",
    currency: "FCFA",
    duration: "30 Jours",
    description: "Le premier pas pour découvrir la méthode en douceur.",
    features: [
      "★ 10 simulations d'expression écrite",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
      "Matériaux de préparation (PDFs)",
    ],
    buttonLabel: "Choisir Essentiel",
    isHighlighted: false,
    isSecondary: false,
    accent: "purple" as const,
  },
  {
    name: "Forfait Intermédiaire",
    price: "3 000",
    currency: "FCFA",
    duration: "30 Jours",
    description: "Plus de pratique pour progresser à votre rythme.",
    features: [
      "★ 20 simulations d'expression écrite",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
      "Matériaux de préparation (PDFs)",
      "Compréhension écrite",
    ],
    buttonLabel: "Choisir Intermédiaire",
    isHighlighted: false,
    isSecondary: false,
    accent: "amber" as const,
  },
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
      "Compréhension écrite",
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

const mixTiers = [
  {
    name: "Forfait Mix Essentiel",
    price: "4 000",
    currency: "FCFA",
    duration: "1 Mois",
    description: "Combinez écrit et oral pour une préparation équilibrée.",
    features: [
      "★ 10 simulations d'expression écrite",
      "★ 10 simulations d'expression orale",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
    ],
    buttonLabel: "Choisir Mix Essentiel",
    isHighlighted: false,
    isSecondary: false,
    accent: "purple" as const,
  },
  {
    name: "Forfait Mix Intermédiaire",
    price: "5 000",
    currency: "FCFA",
    duration: "1 Mois",
    description: "Plus de volume sur les deux épreuves pour progresser vite.",
    features: [
      "★ 20 simulations d'expression écrite",
      "★ 15 simulations d'expression orale",
      "Corrections IA avec scores CECRL",
      "Réponses modèles niveau C2",
    ],
    buttonLabel: "Choisir Mix Intermédiaire",
    isHighlighted: false,
    isSecondary: false,
    accent: "amber" as const,
  },
  {
    name: "Forfait Mix Standard",
    price: "10 000",
    currency: "FCFA",
    duration: "1 Mois",
    description: "Une préparation intensive complète écrit + oral.",
    features: [
      "★ 40 simulations d'expression écrite",
      "★ 25 simulations d'expression orale",
      "Corrections IA détaillées (niveaux CECRL)",
      "Rapports diagnostiques complets",
    ],
    buttonLabel: "Choisir Mix Standard",
    isHighlighted: true,
    isSecondary: false,
  },
  {
    name: "Forfait Mix Excellence",
    price: "20 000",
    currency: "FCFA",
    duration: "2 Mois",
    description: "Le maximum de pratique sur les deux épreuves, sur 2 mois.",
    features: [
      "★ 80 simulations d'expression écrite",
      "★ 50 simulations d'expression orale",
      "Corrections IA détaillées (niveaux CECRL)",
      "Tableau de bord de progression",
    ],
    buttonLabel: "Choisir Mix Excellence",
    isHighlighted: false,
    isSecondary: true,
    badge: "🔥 MEILLEUR VOLUME COMBINÉ",
  },
];

export function PricingSection() {
  return (
    <section id="tarifs" className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[var(--slate-200)]">
            Choisissez votre formule
          </h2>
          <p className="mx-auto max-w-xl text-base text-[var(--slate-400)]">
            Un accès complet aux simulations TEF/TCF Canada avec corrections personnalisées
            par intelligence artificielle.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        <div className="text-center space-y-3">
          <h3 className="font-(family-name:--font-sora) text-2xl font-bold tracking-tight text-[var(--slate-200)]">
            Forfaits Mix — Écrit &amp; Oral
          </h3>
          <p className="mx-auto max-w-xl text-base text-[var(--slate-400)]">
            Un quota indépendant pour chaque épreuve, au sein d&apos;un seul forfait.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mixTiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        <div className="secure-canvas-wrapper text-center">
          <p className="text-xs text-[var(--slate-500)]">
            Les contenus pédagogiques et corrigés sont protégés. Toute reproduction est interdite.
          </p>
        </div>
      </div>
    </section>
  );
}
