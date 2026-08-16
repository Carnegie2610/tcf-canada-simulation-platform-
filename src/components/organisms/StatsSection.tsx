const stats = [
  { value: "98%", label: "Taux de réussite", sublabel: "TCF Canada" },
  { value: "+5 000", label: "Étudiants formés", sublabel: "Depuis 2020" },
  { value: "+5 000", label: "Exercices disponibles", sublabel: "Pack Objectif4C2" },
  { value: "4.9/5", label: "Satisfaction", sublabel: "Note moyenne" },
];

export function StatsSection() {
  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[--slate-200]">
            Pack Objectif4C2 en Chiffres
          </h2>
          <p className="mx-auto max-w-xl text-base text-[--slate-400]">
            Des résultats qui parlent d&apos;eux-mêmes
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="bg-gradient-to-r from-[--brand-red] to-[--accent-orange-text] bg-clip-text font-(family-name:--font-sora) text-4xl font-black tracking-tight text-transparent sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-base font-semibold text-[--slate-200]">{stat.label}</p>
              <p className="mt-1 text-sm text-[--slate-400]">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
