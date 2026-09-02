import { SectionLabel } from "@/components/atoms/SectionLabel";
import { TestimonialCard, type Testimonial } from "@/components/molecules/TestimonialCard";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center space-y-3">
          <SectionLabel>Témoignages</SectionLabel>
          <h2 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[var(--slate-200)]">
            Ce que disent nos étudiants
          </h2>
          <p className="mx-auto max-w-xl text-base text-[var(--slate-400)]">
            Des candidats qui ont préparé leur examen avec Objectif 4C2 et réussi leur
            immigration au Canada.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
