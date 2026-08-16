import Image from "next/image";
import { SectionLabel } from "@/components/atoms/SectionLabel";
import { Button } from "@/components/atoms/Button";
import heroImage from "../../../public/heroimage-1.png";

export function HeroSection() {
  return (
    <section className="hero-glow relative w-full overflow-hidden px-4 py-28 sm:py-36">
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <SectionLabel>Préparation TEF / TCF Canada</SectionLabel>

          <h1 className="mt-6 font-(family-name:--font-sora) text-4xl font-black tracking-tight text-[--slate-200] sm:text-5xl lg:text-6xl">
            Réussissez votre examen de français.{" "}
            <span className="bg-gradient-to-r from-[--brand-red] to-[--accent-orange-text] bg-clip-text text-transparent">
              Immigrez au Canada.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[--slate-400] sm:text-lg lg:mx-0">
            Entraînez-vous sur des sujets d&apos;écriture authentiques et obtenez une
            correction instantanée par IA avec score CECRL et réponse modèle niveau C2.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button variant="primary" size="lg" href="/#tarifs">
              Voir les formules
            </Button>
            <Button variant="ghost" size="lg" href="/#competences">
              Découvrir nos tarifs →
            </Button>
          </div>
        </div>

        <div className="relative order-first lg:order-last">
          <Image
            src={heroImage}
            alt="Étudiant se préparant à l'examen TEF/TCF Canada"
            className="mx-auto w-full max-w-md object-contain lg:max-w-none"
            priority
          />
        </div>
      </div>
    </section>
  );
}
