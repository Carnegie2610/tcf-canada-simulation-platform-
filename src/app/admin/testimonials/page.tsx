"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { StarRating } from "@/components/atoms/StarRating";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TESTIMONIAL_AVATARS_BUCKET } from "@/app/api/admin/testimonials/avatar-upload/route";

interface Testimonial {
  id: string;
  name: string;
  role_text: string | null;
  rating: number;
  content: string;
  avatar_path: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  role_text: "",
  rating: 5,
  content: "",
  avatar_path: null as string | null,
  is_published: true,
  display_order: 0,
};

export default function TestimonialsAdminPage() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/testimonials");
    const json = (await res.json()) as { data?: Testimonial[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(t: Testimonial) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      role_text: t.role_text ?? "",
      rating: t.rating,
      content: t.content,
      avatar_path: t.avatar_path,
      is_published: t.is_published,
      display_order: t.display_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/admin/testimonials/avatar-upload", {
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

      set("avatar_path", publicUrl);
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
      const url = editingId ? `/api/admin/testimonials/${editingId}` : "/api/admin/testimonials";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError("Impossible d'enregistrer le témoignage. Vérifiez les champs (nom, note, contenu).");
        return;
      }
      resetForm();
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce témoignage ? Il disparaîtra de la page d'accueil.")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await load();
  }

  async function togglePublished(t: Testimonial) {
    await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_published: !t.is_published }),
    });
    await load();
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Témoignages</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Gérez les avis affichés sur la page d&apos;accueil. Seuls les témoignages publiés
          sont visibles par les visiteurs.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-3 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
      >
        <div className="flex items-center gap-4">
          <Avatar name={form.name || "?"} avatarUrl={form.avatar_path} size="lg" />
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
              {uploading
                ? "Envoi en cours..."
                : "Optionnel — sans photo, l'initiale du nom est utilisée."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="Nom — ex : Fatou Diallo"
            className={inputCls}
          />
          <input
            value={form.role_text}
            onChange={(e) => set("role_text", e.target.value)}
            placeholder="Contexte — ex : Étudiante TCF, admise au Canada"
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs font-medium text-[var(--slate-400)]">Note</p>
          <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
        </div>

        <textarea
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          required
          rows={4}
          placeholder="Le témoignage..."
          className={`${inputCls} resize-none`}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--slate-400)]">Ordre d&apos;affichage</p>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => set("display_order", Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="rounded border-[var(--slate-600)] bg-[var(--slate-800)]"
            />
            <span className="text-sm text-[var(--slate-300)]">Publié</span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm text-[var(--slate-300)] transition-colors hover:text-[var(--brand-white)]"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)] disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter le témoignage"}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Témoignages {items ? `(${items.length})` : ""}
        </h2>

        {items === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucun témoignage pour le moment.
          </div>
        ) : (
          items.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={t.name} avatarUrl={t.avatar_path} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[var(--brand-white)]">{t.name}</p>
                    {!t.is_published && (
                      <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-[10px] font-medium text-[var(--slate-400)]">
                        Masqué
                      </span>
                    )}
                  </div>
                  {t.role_text && (
                    <p className="text-xs text-[var(--slate-500)]">{t.role_text}</p>
                  )}
                  <div className="mt-1">
                    <StarRating value={t.rating} size="sm" />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-400)]">
                    {t.content}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  onClick={() => togglePublished(t)}
                  className="rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
                >
                  {t.is_published ? "Masquer" : "Publier"}
                </button>
                <button
                  onClick={() => startEdit(t)}
                  className="rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
