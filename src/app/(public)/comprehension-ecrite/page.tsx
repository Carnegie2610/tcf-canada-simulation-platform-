import type { Metadata } from "next";
import { SkillPageTemplate } from "@/components/templates/SkillPageTemplate";

export const metadata: Metadata = {
  title: "Compréhension Écrite — Objectif 4C2 pour tous",
  description:
    "Format, structure et conseils pour réussir l'épreuve de compréhension écrite du TEF/TCF Canada et viser le NCLC 9 ou 10.",
  alternates: {
    canonical: "/comprehension-ecrite",
  },
};

const format = [
  {
    title: "Textes de nature variée",
    description:
      "Petites annonces, courriels, articles de presse, documents administratifs et textes d'opinion, classés par ordre de difficulté croissante.",
  },
  {
    title: "Questions à choix multiple",
    description:
      "Chaque texte est associé à des questions évaluant la compréhension globale, le repérage d'informations précises et l'inférence du sens implicite.",
  },
  {
    title: "Gestion du temps",
    description:
      "Le nombre de textes à traiter dans un temps limité impose une lecture efficace : il faut savoir alterner entre lecture rapide et lecture ciblée.",
  },
];

const tips = [
  "Lisez d'abord le texte en diagonale pour en saisir le sujet général, puis relisez en ciblant l'information demandée par chaque question.",
  "Élargissez votre vocabulaire autour des thèmes administratifs et de l'immigration canadienne : ce sont des contextes fréquents dans les textes proposés.",
  "Chronométrez-vous par exercice pour éviter de passer trop de temps sur une seule question.",
  "Entraînez-vous sur des types de documents variés (presse, courriels professionnels, formulaires officiels) plutôt que sur un seul style de texte.",
  "Méfiez-vous des réponses qui reprennent des mots du texte mais en déforment le sens : la bonne réponse est celle qui correspond à l'idée, pas seulement au vocabulaire.",
];

export default function ComprehensionEcritePage() {
  return (
    <SkillPageTemplate
      emoji="📖"
      title="Compréhension Écrite"
      intro="La compréhension écrite évalue votre capacité à comprendre des documents écrits authentiques — articles, courriels, formulaires — représentatifs de la vie quotidienne et administrative au Canada."
      durationLabel="~1 heure"
      taskCountLabel="Questions à choix multiple"
      format={format}
      tips={tips}
    />
  );
}
