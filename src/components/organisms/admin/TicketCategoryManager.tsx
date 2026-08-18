"use client";

import { useState } from "react";

export interface TicketCategory {
  id: string;
  label: string;
}

interface TicketCategoryManagerProps {
  initialCategories: TicketCategory[];
}

export function TicketCategoryManager({ initialCategories }: TicketCategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ticket-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const json = (await res.json()) as { data?: TicketCategory; error?: string };
      if (!res.ok || !json.data) {
        setError(typeof json.error === "string" ? json.error : "Erreur lors de la création");
        return;
      }
      setCategories((prev) => [...prev, json.data!].sort((a, b) => a.label.localeCompare(b.label)));
      setLabel("");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const res = await fetch(`/api/admin/ticket-categories/${id}`, { method: "DELETE" });
    if (!res.ok) setCategories(previous);
  }

  return (
    <details className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 group">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-white)] select-none">
        Catégories de tickets (proposées aux étudiants)
      </summary>

      <div className="mt-4 space-y-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Problème de connexion"
            className="flex-1 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !label.trim()}
            className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors disabled:opacity-50"
          >
            + Ajouter
          </button>
        </form>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {categories.length === 0 ? (
          <p className="text-xs text-[var(--slate-500)]">Aucune catégorie créée pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-2 rounded-full border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1.5 text-xs text-[var(--slate-300)]"
              >
                {c.label}
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label={`Supprimer ${c.label}`}
                  className="text-[var(--slate-500)] hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
