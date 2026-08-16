import { SectionLabel } from "@/components/atoms/SectionLabel";

const faqs = [
  {
    question: "Quelle est la différence entre le TEF Canada et le TCF Canada ?",
    answer:
      "Le TEF Canada (Test d'Évaluation de Français) et le TCF Canada (Test de Connaissance du Français) sont deux tests distincts, reconnus tous les deux par Immigration, Réfugiés et Citoyenneté Canada (IRCC) pour évaluer votre niveau de français dans le cadre d'une demande d'immigration. Ils évaluent les 4 mêmes compétences — compréhension orale, compréhension écrite, expression orale et expression écrite — mais avec un format d'épreuve différent selon l'organisme certificateur.",
  },
  {
    question: "Qu'est-ce que le NCLC 9 ou 10 et pourquoi est-ce important ?",
    answer:
      "Le NCLC (Niveaux de compétence linguistique canadiens) est l'échelle utilisée par IRCC pour convertir votre score aux tests de français. Les niveaux 9 et 10 correspondent à un niveau C1/C2 sur l'échelle du CECRL, soit une maîtrise avancée à quasi-native du français. Atteindre ces niveaux maximise généralement les points attribués aux compétences linguistiques dans une demande d'immigration — les grilles de points exactes évoluent, il est donc essentiel de vérifier les critères à jour directement sur le site d'IRCC.",
  },
  {
    question: "Combien de temps faut-il pour se préparer au TEF ou au TCF Canada ?",
    answer:
      "Cela dépend de votre niveau de départ et de votre objectif de score. Un candidat déjà à l'aise à l'oral et à l'écrit peut viser 3 à 6 semaines de préparation intensive centrée sur le format de l'examen, tandis qu'un niveau intermédiaire nécessitera plusieurs mois de pratique régulière. Le plus important est de s'entraîner dans les conditions réelles de l'examen (temps limité, consignes précises) plutôt que de simplement réviser la grammaire.",
  },
  {
    question: "Comment fonctionne la correction par intelligence artificielle sur Objectif4C2 ?",
    answer:
      "Chaque production écrite ou orale est évaluée par une IA calibrée sur les critères officiels du CECRL (grammaire, richesse lexicale, cohérence, adéquation à la consigne). Vous recevez un score détaillé par critère, une estimation de votre niveau CECRL, ainsi qu'une réponse modèle de niveau C2 pour comprendre précisément où et comment progresser.",
  },
  {
    question: "Le Pack Objectif4C2 couvre-t-il les 4 compétences de l'examen ?",
    answer:
      "Oui. Selon la formule choisie, vous avez accès à des simulations d'expression écrite, d'expression orale, ainsi qu'à des ressources pour la compréhension orale et écrite. Consultez la section tarifs pour voir en détail ce qu'inclut chaque formule.",
  },
  {
    question: "Combien de temps les résultats du TEF/TCF Canada sont-ils valables ?",
    answer:
      "Les résultats sont généralement valables 2 ans à compter de la date du test pour une demande d'immigration au Canada. Cette durée de validité peut évoluer selon le programme d'immigration visé — vérifiez toujours l'information à jour sur le site officiel d'IRCC avant de planifier votre dossier.",
  },
  {
    question: "Puis-je m'entraîner sur mobile ?",
    answer:
      "Oui, la plateforme Objectif4C2 est entièrement responsive : vous pouvez rédiger vos simulations, consulter vos corrections et suivre votre progression depuis un ordinateur, une tablette ou un smartphone.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export function FAQSection() {
  return (
    <section className="w-full px-4 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="text-center space-y-3">
          <SectionLabel>Questions fréquentes</SectionLabel>
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-white">
            Tout savoir sur le TEF/TCF Canada
          </h2>
          <p className="mx-auto max-w-xl text-base text-[--slate-400]">
            Les réponses aux questions les plus courantes sur l&apos;examen et notre méthode de
            préparation.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl bg-[--slate-900] p-6 open:pb-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-(family-name:--font-sora) text-lg font-bold text-white marker:content-none">
                {faq.question}
                <svg
                  className="h-5 w-5 shrink-0 text-[--slate-500] transition-transform duration-200 group-open:rotate-180"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[--slate-400]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
