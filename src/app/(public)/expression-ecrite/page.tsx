import type { Metadata } from "next";
import { SkillPageTemplate } from "@/components/templates/SkillPageTemplate";

export const metadata: Metadata = {
  title: "Expression Écrite — Objectif 4C2 pour tous",
  description:
    "Format, structure et conseils pour réussir l'épreuve d'expression écrite du TEF/TCF Canada avec nos simulations et corrections IA.",
  alternates: {
    canonical: "/expression-ecrite",
  },
};

const format = [
  {
    title: "Tâche 1 — Message ou description",
    description:
      "Rédiger un texte court relatant une expérience personnelle ou une situation du quotidien (message, courriel, description d'un événement).",
  },
  {
    title: "Tâche 2 — Texte argumentatif",
    description:
      "Exprimer et justifier une opinion sur un sujet donné, en structurant clairement vos arguments et exemples.",
  },
  {
    title: "Tâche 3 — Analyse et commentaire",
    description:
      "Interpréter un document (statistiques, graphique, situation présentée) puis développer un point de vue argumenté et nuancé.",
  },
];

const tips = [
  "Respectez systématiquement le nombre de mots minimum demandé : une production trop courte est pénalisée quelle que soit sa qualité.",
  "Structurez chaque texte avec une introduction, un développement en paragraphes distincts, et une conclusion.",
  "Maîtrisez les connecteurs logiques (d'abord, cependant, par conséquent, en revanche...) pour rendre votre argumentation fluide et cohérente.",
  "Entraînez-vous à écrire dans le temps imparti — la gestion du temps est aussi déterminante que la qualité linguistique.",
  "Relisez systématiquement pour corriger les accords, les temps verbaux et l'orthographe avant la fin de l'épreuve.",
  "Utilisez un vocabulaire varié et précis plutôt que de répéter les mêmes termes : c'est un critère d'évaluation du niveau CECRL.",
];

export default function ExpressionEcritePage() {
  return (
    <SkillPageTemplate
      emoji="✍️"
      title="Expression Écrite"
      intro="L'expression écrite évalue votre capacité à rédiger des textes clairs, structurés et argumentés en français — la compétence la plus travaillée sur Objectif 4C2 grâce à nos simulations et corrections IA détaillées."
      durationLabel="~60 minutes"
      taskCountLabel="3 tâches progressives"
      format={format}
      tips={tips}
    />
  );
}
