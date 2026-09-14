"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  target: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sublabel: string;
}

const stats: Stat[] = [
  { target: 98, suffix: "%", label: "Taux de réussite", sublabel: "TCF Canada" },
  { target: 5000, prefix: "+", label: "Étudiants formés", sublabel: "Depuis 2020" },
  { target: 5000, prefix: "+", label: "Exercices disponibles", sublabel: "Pack Objectif4C2" },
  { target: 4.9, decimals: 1, suffix: "/5", label: "Satisfaction", sublabel: "Note moyenne" },
];

function CountUpValue({ target, decimals = 0, prefix = "", suffix = "" }: Stat) {
  const [value, setValue] = useState(0);
  const elRef = useRef<HTMLParagraphElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();

        const duration = 1500;
        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(target * eased);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("fr-FR");

  return (
    <p
      ref={elRef}
      className="font-(family-name:--font-sora) text-4xl font-black tracking-tight text-[var(--slate-200)] sm:text-5xl"
    >
      {prefix}
      {formatted}
      {suffix}
    </p>
  );
}

export function StatsSection() {
  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-(family-name:--font-sora) bg-gradient-to-r from-[var(--brand-red)] to-[var(--accent-orange-text)] bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Pack Objectif4C2 en Chiffres
          </h2>
          <p className="mx-auto max-w-xl text-base text-[var(--slate-400)]">
            Des résultats qui parlent d&apos;eux-mêmes
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <CountUpValue {...stat} />
              <p className="mt-2 text-base font-semibold text-[var(--slate-200)]">{stat.label}</p>
              <p className="mt-1 text-sm text-[var(--slate-400)]">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
