import type { Metadata } from "next";
import { SkillPageTemplate } from "@/components/templates/SkillPageTemplate";

export const metadata: Metadata = {
  title: "Compréhension Orale — Objectif 4C2 pour tous",
  description:
    "Format, structure et conseils pour réussir l'épreuve de compréhension orale du TEF/TCF Canada et viser le NCLC 9 ou 10.",
  alternates: {
    canonical: "/comprehension-orale",
  },
};

const format = [
  {
    title: "Documents sonores variés",
    description:
      "Dialogues du quotidien, annonces publiques, bulletins d'information et extraits radiophoniques, présentés dans un ordre de difficulté croissante.",
  },
  {
    title: "Questions à choix multiple",
    description:
      "Chaque document est suivi d'une ou plusieurs questions à choix multiple portant sur l'information explicite ou implicite du message entendu.",
  },
  {
    title: "Écoute unique",
    description:
      "Les enregistrements ne sont généralement diffusés qu'une seule fois : la capacité à capter l'essentiel dès la première écoute est déterminante.",
  },
];

const tips = [
  "Lisez la question et les propositions de réponse avant le début de l'enregistrement pour savoir quoi écouter.",
  "Écoutez quotidiennement des podcasts, journaux radio ou émissions en français (idéalement avec des accents variés, y compris québécois).",
  "Entraînez-vous à repérer les mots-clés plutôt qu'à comprendre chaque mot — l'objectif est le sens global et les informations précises demandées.",
  "Ne laissez jamais une question sans réponse : une réponse au hasard ne vous pénalise pas plus qu'une absence de réponse.",
  "Travaillez votre rapidité de lecture des questions, car le temps entre deux documents sonores est limité.",
];

export default function ComprehensionOralePage() {
  return (
    <SkillPageTemplate
      emoji="🎧"
      title="Compréhension Orale"
      intro="La compréhension orale évalue votre capacité à comprendre des messages en français parlé dans des situations de la vie courante et professionnelle — une compétence clé pour votre intégration au Canada."
      durationLabel="~35 minutes"
      taskCountLabel="Questions à choix multiple"
      format={format}
      tips={tips}
    />
  );
}
