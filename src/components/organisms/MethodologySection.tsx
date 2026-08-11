const bulletPoints = [
  "Parcours pour les 4 épreuves du TCF Canada.",
  "Correction rapide pour transformer les erreurs en progrès.",
  "Guides publics pour comprendre le format et les scores.",
  "Conseils pratiques pour travailler avec méthode.",
];

const CheckIcon = () => (
  <svg
    className="mt-0.5 h-4 w-4 shrink-0 text-[--brand-red]"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

export function MethodologySection() {
  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <div className="space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-white">
            Préparation TCF Canada
          </h2>
          <p className="text-lg font-semibold text-[--slate-200]">
            Une méthode claire pour progresser dans les 4 épreuves
          </p>
        </div>

        <div className="space-y-4 text-left sm:text-center">
          <p className="text-base leading-relaxed text-[--slate-400]">
            <span className="font-semibold text-white">Pack Objectif4C2</span> aide les candidats
            à préparer le TCF Canada avec des exercices organisés par compétence, des simulations
            et une correction IA pour l&apos;expression écrite et orale.
          </p>
          <p className="text-base leading-relaxed text-[--slate-400]">
            L&apos;objectif est simple : comprendre le format, s&apos;entraîner régulièrement,
            corriger ses erreurs et arriver plus confiant le jour de l&apos;examen.
          </p>
        </div>

        <ul className="mx-auto max-w-md space-y-3 text-left">
          {bulletPoints.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-[--slate-400]">
              <CheckIcon />
              {point}
            </li>
          ))}
        </ul>

        <h3 className="font-(family-name:--font-sora) text-xl font-bold text-white">
          Pourquoi choisir Pack Objectif4C2 ?
        </h3>
      </div>
    </section>
  );
}
