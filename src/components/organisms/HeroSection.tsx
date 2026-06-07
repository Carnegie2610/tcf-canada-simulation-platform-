import { SectionLabel } from "@/components/atoms/SectionLabel";
import { Button } from "@/components/atoms/Button";

export function HeroSection() {
  return (
    <section className="hero-glow relative w-full overflow-hidden px-4 py-28 sm:py-36">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <SectionLabel>Préparation TEF / TCF Canada</SectionLabel>

        <h1 className="mt-6 font-(family-name:--font-sora) text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Réussissez votre examen de français.{" "}
          <span className="bg-gradient-to-r from-[--brand-red] to-orange-400 bg-clip-text text-transparent">
            Immigrez au Canada.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[--slate-400] sm:text-lg">
          Entraînez-vous sur des sujets d&apos;écriture authentiques et obtenez une
          correction instantanée par IA avec score CECRL et réponse modèle niveau C2.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" href="/#tarifs">
            Voir les formules
          </Button>
          <Button variant="ghost" size="lg" href="/#competences">
            Découvrir nos tarifs →
          </Button>
        </div>
      </div>
    </section>
  );
}
