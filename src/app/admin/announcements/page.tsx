"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/announcements");
    const json = (await res.json()) as { data?: Announcement[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        setError("Impossible de publier l'annonce. Vérifiez le titre (3 car. min) et le message (5 car. min).");
        return;
      }
      setTitle("");
      setBody("");
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette annonce ? Elle disparaîtra des notifications des étudiants.")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Annonces</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Publiez une information visible par tous les étudiants — elle apparaît
          immédiatement dans leurs notifications.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 space-y-3 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Titre — ex : Nouvelle session TCF en septembre"
          className="w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          placeholder="Votre message aux étudiants..."
          className="w-full resize-none rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)] disabled:opacity-50"
          >
            {saving ? "Publication..." : "Publier l'annonce"}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Annonces publiées {items ? `(${items.length})` : ""}
        </h2>

        {items === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucune annonce publiée pour le moment.
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--brand-white)]">{a.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--slate-400)]">
                    {a.body}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--slate-500)]">
                    Publiée le {new Date(a.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
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
