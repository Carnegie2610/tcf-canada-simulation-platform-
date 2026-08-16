import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expression Écrite — Objectif 4C2 pour tous",
  description: "Préparez l'expression écrite du TEF/TCF Canada avec nos simulations et corrections IA.",
  alternates: {
    canonical: "/expression-ecrite",
  },
};

export default function ExpressionEcritePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-(family-name:--font-sora) text-4xl font-black text-white">
        ✍️ Expression Écrite
      </h1>
      <p className="mt-4 text-[--slate-400]">
        Contenu détaillé disponible prochainement — Module 2.
      </p>
    </section>
  );
}
