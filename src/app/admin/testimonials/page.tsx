"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { StarRating } from "@/components/atoms/StarRating";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TESTIMONIAL_AVATARS_BUCKET } from "@/lib/constants/storage";

type Status = "pending" | "approved" | "rejected";

interface Testimonial {
  id: string;
  name: string;
  role_text: string | null;
  rating: number;
  content: string;
  avatar_path: string | null;
  status: Status;
  display_order: number;
  user_id: string | null;
  created_at: string;
}

interface EditState {
  name: string;
  role_text: string;
  rating: number;
  content: string;
  avatar_path: string | null;
  display_order: number;
}

const STATUS_LABEL: Record<Status, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Rejeté",
};

const STATUS_BADGE_CLASS: Record<Status, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
};

function toEditState(t: Testimonial): EditState {
  return {
    name: t.name,
    role_text: t.role_text ?? "",
    rating: t.rating,
    content: t.content,
    avatar_path: t.avatar_path,
    display_order: t.display_order,
  };
}

export default function TestimonialsAdminPage() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  function startEdit(t: Testimonial) {
    setEditingId(t.id);
    setEditForm(toEditState(t));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function setField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;

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
      setField("avatar_path", publicUrl);
    } catch {
      setError("Erreur réseau lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("L'action a échoué. Réessayez.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editForm) return;
    await patch(id, {
      name: editForm.name,
      role_text: editForm.role_text || null,
      rating: editForm.rating,
      content: editForm.content,
      avatar_path: editForm.avatar_path,
      display_order: editForm.display_order,
    });
    cancelEdit();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce témoignage définitivement ?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const pending = items?.filter((t) => t.status === "pending") ?? [];
  const processed = items?.filter((t) => t.status !== "pending") ?? [];

  function renderCard(t: Testimonial) {
    const isEditing = editingId === t.id;
    const isBusy = busyId === t.id;

    if (isEditing && editForm) {
      return (
        <div
          key={t.id}
          className="space-y-3 rounded-xl border border-blue-500/40 bg-[var(--slate-900)] p-5"
        >
          <div className="flex items-center gap-4">
            <Avatar name={editForm.name || "?"} avatarUrl={editForm.avatar_path} size="lg" />
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                disabled={uploading}
                className="text-xs text-[var(--slate-400)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--blue-600)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[var(--blue-500)]"
              />
              {uploading && <p className="text-[11px] text-[var(--slate-500)]">Envoi en cours...</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={editForm.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Nom"
              className={inputCls}
            />
            <input
              value={editForm.role_text}
              onChange={(e) => setField("role_text", e.target.value)}
              placeholder="Contexte"
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-[var(--slate-400)]">Note</p>
            <StarRating value={editForm.rating} onChange={(v) => setField("rating", v)} />
          </div>

          <textarea
            value={editForm.content}
            onChange={(e) => setField("content", e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
          />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--slate-400)]">Ordre d&apos;affichage</p>
            <input
              type="number"
              value={editForm.display_order}
              onChange={(e) => setField("display_order", Number(e.target.value))}
              className={`${inputCls} w-32`}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm text-[var(--slate-300)] transition-colors hover:text-[var(--brand-white)]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => handleSaveEdit(t.id)}
              disabled={isBusy || uploading}
              className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)] disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={t.id}
        className="flex items-start justify-between gap-4 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={t.name} avatarUrl={t.avatar_path} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[var(--brand-white)]">{t.name}</p>
              <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
              <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-[10px] font-medium text-[var(--slate-400)]">
                {t.user_id ? "Étudiant" : "Visiteur"}
              </span>
            </div>
            {t.role_text && <p className="text-xs text-[var(--slate-500)]">{t.role_text}</p>}
            <div className="mt-1">
              <StarRating value={t.rating} size="sm" />
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-400)]">
              {t.content}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {t.status !== "approved" && (
            <button
              disabled={isBusy}
              onClick={() => patch(t.id, { status: "approved" })}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Approuver
            </button>
          )}
          {t.status !== "rejected" && (
            <button
              disabled={isBusy}
              onClick={() => patch(t.id, { status: "rejected" })}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              Rejeter
            </button>
          )}
          {t.status !== "pending" && (
            <button
              disabled={isBusy}
              onClick={() => patch(t.id, { status: "pending" })}
              className="rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)] disabled:opacity-50"
            >
              Remettre en attente
            </button>
          )}
          <button
            onClick={() => startEdit(t)}
            className="rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
          >
            Modifier
          </button>
          <button
            disabled={isBusy}
            onClick={() => handleDelete(t.id)}
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Témoignages</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Les étudiants et les visiteurs peuvent soumettre un témoignage. Approuvez-le pour
          qu&apos;il apparaisse sur la page d&apos;accueil.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          En attente {items ? `(${pending.length})` : ""}
        </h2>

        {items === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucun témoignage en attente.
          </div>
        ) : (
          pending.map(renderCard)
        )}
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Traités {items ? `(${processed.length})` : ""}
        </h2>

        {items !== null && processed.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucun témoignage traité pour le moment.
          </div>
        ) : (
          processed.map(renderCard)
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
