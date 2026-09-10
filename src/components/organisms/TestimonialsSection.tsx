"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/atoms/SectionLabel";
import { TestimonialCard, type Testimonial } from "@/components/molecules/TestimonialCard";
import { TestimonialSubmitPublicModal } from "./TestimonialSubmitPublicModal";
import { capture } from "@/lib/posthog";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [modalOpen, setModalOpen] = useState(false);

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

        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--slate-500)]">
            Soyez le premier à partager votre expérience !
          </p>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              capture("testimonial_modal_opened", { source: "public" });
              setModalOpen(true);
            }}
            className="rounded-lg border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--accent-red-text)] transition-colors hover:bg-[var(--brand-red)]/20"
          >
            Partagez votre expérience
          </button>
        </div>
      </div>

      <TestimonialSubmitPublicModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
