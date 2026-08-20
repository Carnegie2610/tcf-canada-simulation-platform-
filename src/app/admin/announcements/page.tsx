"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  created_at: string;
}

interface AnnouncementType {
  id: string;
  label: string;
  icon: string;
}

// Quick-pick suggestions for the "add a type" form — free entry is still allowed,
// these just save hunting for an emoji keyboard.
const ICON_SUGGESTIONS = ["📢", "⚠️", "📅", "🎉", "📝", "🎓", "💡", "🔧", "🔔", "✅", "🚀", "❗"];

const DEFAULT_ICON = "📢";

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [types, setTypes] = useState<AnnouncementType[]>([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState(ICON_SUGGESTIONS[0]);

  async function loadTypes() {
    const res = await fetch("/api/admin/announcement-types");
    const json = (await res.json()) as { data?: AnnouncementType[] };
    setTypes(json.data ?? []);
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeLabel.trim() || !newTypeIcon.trim()) return;
    await fetch("/api/admin/announcement-types", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: newTypeLabel.trim(), icon: newTypeIcon.trim() }),
    });
    setNewTypeLabel("");
    setNewTypeIcon(ICON_SUGGESTIONS[0]);
    setShowTypeForm(false);
    await loadTypes();
  }

  async function handleDeleteType(t: AnnouncementType) {
    if (!window.confirm(`Supprimer le type « ${t.label} » ? Les annonces déjà publiées gardent leur icône.`)) return;
    await fetch(`/api/admin/announcement-types/${t.id}`, { method: "DELETE" });
    await loadTypes();
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/announcements");
    const json = (await res.json()) as { data?: Announcement[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
    void loadTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, icon }),
      });
      if (!res.ok) {
        setError("Impossible de publier l'annonce. Vérifiez le titre (3 car. min) et le message (5 car. min).");
        return;
      }
      setTitle("");
      setBody("");
      setIcon(DEFAULT_ICON);
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--slate-400)]">Type d&apos;annonce</p>
            <button
              type="button"
              onClick={() => setShowTypeForm((v) => !v)}
              className="rounded-lg border border-blue-500/40 bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-blue-text)] transition-colors hover:bg-blue-600/20"
            >
              {showTypeForm ? "✕ Annuler" : "＋ Ajouter un type"}
            </button>
          </div>

          {showTypeForm && (
            <div className="space-y-2 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-950)]/60 p-3">
              <div className="flex flex-wrap gap-1.5">
                {ICON_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewTypeIcon(e)}
                    className={`rounded-md border px-2 py-1 text-base transition-colors ${
                      newTypeIcon === e
                        ? "border-blue-500 bg-blue-600/20"
                        : "border-[var(--slate-700)] hover:bg-[var(--slate-800)]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTypeIcon}
                  onChange={(e) => setNewTypeIcon(e.target.value)}
                  maxLength={10}
                  placeholder="Icône"
                  className={`${inputCls} w-20 text-center`}
                />
                <input
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  maxLength={100}
                  placeholder="Nom du type — ex : Résultats"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={handleAddType}
                  className="shrink-0 rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)]"
                >
                  Créer
                </button>
              </div>
            </div>
          )}

          {types.length === 0 ? (
            <p className="text-xs text-[var(--slate-500)]">
              Aucun type défini — ajoutez-en un pour catégoriser vos annonces.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <span
                  key={t.id}
                  className={`group flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    icon === t.icon
                      ? "border-blue-500 bg-blue-600/20 text-blue-300"
                      : "border-[var(--slate-700)] text-[var(--slate-400)] hover:bg-[var(--slate-800)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIcon(t.icon)}
                    aria-pressed={icon === t.icon}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteType(t)}
                    aria-label={`Supprimer le type ${t.label}`}
                    title="Supprimer ce type"
                    className="ml-0.5 text-[var(--slate-600)] transition-colors hover:text-red-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

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
                  <p className="text-sm font-bold text-[var(--brand-white)]">
                    <span className="mr-1.5">{a.icon || DEFAULT_ICON}</span>
                    {a.title}
                  </p>
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

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
