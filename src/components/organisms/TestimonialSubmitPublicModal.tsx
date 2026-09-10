"use client";

import { useState } from "react";
import { StarRating } from "@/components/atoms/StarRating";
import { capture } from "@/lib/posthog";

interface TestimonialSubmitPublicModalProps {
  open: boolean;
  onClose: () => void;
}

export function TestimonialSubmitPublicModal({
  open,
  onClose,
}: TestimonialSubmitPublicModalProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real visitors never see this field
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  function handleClose() {
    setSubmitted(false);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, rating, content, website }),
      });
      if (res.status === 429) {
        setError("Trop de témoignages envoyés récemment. Réessayez plus tard.");
        return;
      }
      if (!res.ok) {
        setError("Impossible d'envoyer votre témoignage. Vérifiez les champs.");
        return;
      }
      capture("testimonial_submitted", { source: "public" });
      setSubmitted(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-testimonial-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-[var(--slate-700)] bg-[var(--slate-900)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--slate-800)] px-6 py-5">
          <h2 id="public-testimonial-title" className="text-lg font-extrabold text-[var(--brand-white)]">
            Partagez votre expérience
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--slate-400)]">
            Votre témoignage sera publié après validation par notre équipe.
          </p>
        </div>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium text-emerald-400">
              Merci ! Votre témoignage a bien été envoyé et sera publié après validation.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)]"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-6 py-5">
            {/* Honeypot — visually hidden from real visitors, off-screen (not
                display:none, which some bots skip) so it stays in the tab/DOM
                flow that naive scrapers fill blindly. */}
            <div
              className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
              aria-hidden="true"
            >
              <label htmlFor="website">Site web</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Votre nom"
              className={inputCls}
            />

            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-[var(--slate-400)]">Note</p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Votre témoignage..."
              className={`${inputCls} resize-none`}
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm text-[var(--slate-300)] transition-colors hover:text-[var(--brand-white)]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)] disabled:opacity-50"
              >
                {saving ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
