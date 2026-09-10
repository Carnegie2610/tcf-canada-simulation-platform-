"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { StarRating } from "@/components/atoms/StarRating";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TESTIMONIAL_AVATARS_BUCKET } from "@/lib/constants/storage";

interface TestimonialSubmitModalProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
}

export function TestimonialSubmitModal({ open, onClose, studentName }: TestimonialSubmitModalProps) {
  const [name, setName] = useState(studentName);
  const [roleText, setRoleText] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleClose() {
    setSubmitted(false);
    setError(null);
    onClose();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/student/testimonials/avatar-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!signRes.ok) {
        setError("Format d'image non supporté (png, jpg, webp, gif uniquement).");
        return;
      }
      const { token, path, publicUrl } = (await signRes.json()) as {
        token: string;
        path: string;
        publicUrl: string;
      };

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(TESTIMONIAL_AVATARS_BUCKET)
        .uploadToSignedUrl(path, token, file);

      if (uploadError) {
        setError("Échec de l'envoi de la photo. Réessayez.");
        return;
      }
      setAvatarPath(publicUrl);
    } catch {
      setError("Erreur réseau lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/student/testimonials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          role_text: roleText || undefined,
          rating,
          content,
          avatar_path: avatarPath,
        }),
      });
      if (!res.ok) {
        setError("Impossible d'envoyer votre témoignage. Vérifiez les champs.");
        return;
      }
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
      aria-labelledby="testimonial-submit-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-2 border-[var(--slate-700)] bg-[var(--slate-900)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--slate-800)] px-6 py-5">
          <h2 id="testimonial-submit-title" className="text-lg font-extrabold text-[var(--brand-white)]">
            Partagez votre expérience
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--slate-400)]">
            Votre témoignage sera publié sur la page d&apos;accueil après validation par
            notre équipe.
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
            <div className="flex items-center gap-4">
              <Avatar name={name || "?"} avatarUrl={avatarPath} size="lg" />
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                  className="text-xs text-[var(--slate-400)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--blue-600)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[var(--blue-500)]"
                />
                <p className="text-[11px] text-[var(--slate-500)]">
                  {uploading ? "Envoi en cours..." : "Optionnel — sinon votre initiale sera utilisée."}
                </p>
              </div>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Votre nom"
              className={inputCls}
            />
            <input
              value={roleText}
              onChange={(e) => setRoleText(e.target.value)}
              placeholder="Contexte — ex : Étudiant TCF, admis au Canada"
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
                disabled={saving || uploading}
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
