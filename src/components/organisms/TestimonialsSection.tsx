"use client";

import { useEffect, useRef, useState } from "react";
import { TestimonialCard, type Testimonial } from "@/components/molecules/TestimonialCard";
import { TestimonialSubmitPublicModal } from "./TestimonialSubmitPublicModal";
import { capture } from "@/lib/posthog";

const AUTO_SCROLL_PX_PER_SECOND = 32;
const ARROW_PAUSE_MS = 2500;

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Précédent" : "Suivant"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--slate-700)] bg-[var(--slate-900)] text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4"
      >
        {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hoverPausedRef = useRef(false);
  const manualPausedUntilRef = useRef(0);

  const loopItems = testimonials.length > 0 ? [...testimonials, ...testimonials] : [];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || testimonials.length === 0) return;

    let frameId: number;
    let lastTime: number | null = null;

    function step(time: number) {
      if (lastTime === null) lastTime = time;
      const deltaMs = time - lastTime;
      lastTime = time;

      const paused = hoverPausedRef.current || Date.now() < manualPausedUntilRef.current;
      if (!paused && el) {
        el.scrollLeft += (deltaMs / 1000) * AUTO_SCROLL_PX_PER_SECOND;
        const singleSetWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= singleSetWidth) {
          el.scrollLeft -= singleSetWidth;
        }
      }
      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [testimonials.length]);

  function scrollByCard(direction: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    manualPausedUntilRef.current = Date.now() + ARROW_PAUSE_MS;
    const card = el.querySelector<HTMLElement>("[data-testimonial-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <section className="w-full px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-(family-name:--font-sora) bg-gradient-to-r from-[var(--brand-red)] to-[var(--accent-orange-text)] bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Témoignages
            </h2>
            <p className="max-w-xl text-base text-[var(--slate-400)]">
              Des candidats qui ont préparé leur examen avec Objectif 4C2 et réussi leur
              immigration au Canada.
            </p>
          </div>

          {testimonials.length > 0 && (
            <div className="flex gap-2">
              <ArrowButton direction="left" onClick={() => scrollByCard("left")} />
              <ArrowButton direction="right" onClick={() => scrollByCard("right")} />
            </div>
          )}
        </div>

        {testimonials.length > 0 ? (
          <div
            ref={scrollerRef}
            onMouseEnter={() => {
              hoverPausedRef.current = true;
            }}
            onMouseLeave={() => {
              hoverPausedRef.current = false;
            }}
            onPointerDown={() => {
              manualPausedUntilRef.current = Date.now() + ARROW_PAUSE_MS;
            }}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loopItems.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                data-testimonial-card
                className="w-[80vw] shrink-0 sm:w-[45vw] lg:w-[calc((100%-3rem)/3.3)]"
              >
                <TestimonialCard testimonial={t} />
              </div>
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
