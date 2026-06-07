import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compréhension Orale — Objectif 4C2 pour tous",
  description: "Préparez la compréhension orale du TEF/TCF Canada avec nos ressources et stratégies.",
};

export default function ComprehensionOralePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-(family-name:--font-sora) text-4xl font-black text-white">
        🎧 Compréhension Orale
      </h1>
      <p className="mt-4 text-[--slate-400]">
        Contenu détaillé disponible prochainement — Module 2.
      </p>
    </section>
  );
}
