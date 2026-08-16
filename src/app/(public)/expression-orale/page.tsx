import type { Metadata } from "next";
import { SkillPageTemplate } from "@/components/templates/SkillPageTemplate";

export const metadata: Metadata = {
  title: "Expression Orale — Objectif 4C2 pour tous",
  description:
    "Format, structure et conseils pour réussir l'épreuve d'expression orale du TEF/TCF Canada et viser le NCLC 9 ou 10.",
  alternates: {
    canonical: "/expression-orale",
  },
};

const format = [
  {
    title: "Tâche 1 — Prise de contact",
    description:
      "Se présenter et poser des questions à l'examinateur sur un sujet donné, afin d'obtenir des informations précises.",
  },
  {
    title: "Tâche 2 — Discussion argumentée",
    description:
      "Défendre un point de vue sur un sujet, répondre aux objections et convaincre l'examinateur au fil de l'échange.",
  },
  {
    title: "Tâche 3 — Expression d'un point de vue",
    description:
      "Développer et argumenter une opinion personnelle sur un thème plus abstrait, avec un discours structuré et nuancé.",
  },
];

const tips = [
  "Enregistrez-vous à l'oral et réécoutez-vous : c'est le meilleur moyen de repérer les hésitations, répétitions et erreurs de prononciation.",
  "Entraînez-vous à penser directement en français plutôt qu'à traduire mentalement depuis votre langue maternelle.",
  "Préparez des formules types pour ouvrir et conclure une prise de parole (introduire un sujet, nuancer une opinion, conclure un échange).",
  "Privilégiez la fluidité et la clarté du discours plutôt que la perfection grammaticale absolue — l'examinateur évalue la communication globale.",
  "Simulez les conditions réelles de l'épreuve avec un chronomètre pour vous habituer à structurer vos idées rapidement.",
  "Travaillez votre intonation et votre débit : une élocution naturelle et posée est perçue plus favorablement qu'un discours précipité.",
];

export default function ExpressionOralePage() {
  return (
    <SkillPageTemplate
      emoji="🎤"
      title="Expression Orale"
      intro="L'expression orale évalue votre capacité à communiquer spontanément et avec aisance en français, à travers un échange interactif avec un examinateur."
      durationLabel="~12 minutes"
      taskCountLabel="3 tâches progressives"
      format={format}
      tips={tips}
    />
  );
}
