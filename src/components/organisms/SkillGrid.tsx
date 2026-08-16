import { SkillCard } from "@/components/molecules/SkillCard";

const skills = [
  {
    icon: "🎧",
    title: "Compréhension Orale",
    description:
      "Maîtrisez l'écoute active de dialogues, bulletins d'information et annonces officielles.",
    href: "/comprehension-orale",
  },
  {
    icon: "📖",
    title: "Compréhension Écrite",
    description:
      "Analysez des textes administratifs, articles de presse et documents courants.",
    href: "/comprehension-ecrite",
  },
  {
    icon: "✍️",
    title: "Expression Écrite",
    description:
      "Rédigez des lettres, courriels et textes argumentatifs conformes aux critères CECRL.",
    href: "/expression-ecrite",
  },
  {
    icon: "🎤",
    title: "Expression Orale",
    description:
      "Préparez vos productions orales : monologue guidé, interaction et point de vue.",
    href: "/expression-orale",
  },
];

export function SkillGrid() {
  return (
    <section id="competences" className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[--slate-200]">
            Les 4 compétences évaluées
          </h2>
          <p className="mx-auto max-w-xl text-base text-[--slate-400]">
            Le TEF et TCF Canada évaluent quatre composantes linguistiques. Entraînez-vous
            sur chacune d&apos;elles avec notre simulateur.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
            <SkillCard key={skill.href} {...skill} />
          ))}
        </div>
      </div>
    </section>
  );
}
