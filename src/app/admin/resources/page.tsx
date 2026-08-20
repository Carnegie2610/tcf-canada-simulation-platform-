"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const RESOURCES_BUCKET = "resources";
const MAX_MB = 50;

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_size: number | null;
  created_at: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;
}

export default function AdminResourcesPage() {
  const [items, setItems] = useState<Resource[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/resources");
    const json = (await res.json()) as { data?: Resource[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Veuillez sélectionner un fichier PDF.");
    if (file.type !== "application/pdf") return setError("Seuls les fichiers PDF sont acceptés.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Fichier trop volumineux (max ${MAX_MB} Mo).`);

    setUploading(true);
    try {
      // 1. Ask the server for a signed slot, 2. send the file straight to storage,
      // 3. tell the server it landed. The bytes never pass through the API route.
      const signRes = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!signRes.ok) throw new Error("sign_failed");
      const { token, path } = (await signRes.json()) as { token: string; path: string };

      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage
        .from(RESOURCES_BUCKET)
        .uploadToSignedUrl(path, token, file, { contentType: "application/pdf" });
      if (upErr) throw new Error("upload_failed");

      const confirmRes = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          storage_path: path,
          file_size: file.size,
        }),
      });
      if (!confirmRes.ok) throw new Error("confirm_failed");

      setTitle("");
      setDescription("");
      setFile(null);
      (document.getElementById("resource-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("resource-file") as HTMLInputElement).value = "");
      await load();
    } catch {
      setError("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce document ? Les étudiants n'y auront plus accès.")) return;
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Ressources PDF</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Mettez des documents à disposition des étudiants — ils apparaissent dans
          leur espace « Ressources ».
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="mt-6 space-y-3 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Titre — ex : Guide complet de l'expression écrite"
          className={inputCls}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Description (optionnelle) — à quoi sert ce document ?"
          className={`${inputCls} resize-none`}
        />
        <input
          id="resource-file"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[var(--slate-400)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--slate-700)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--slate-200)] hover:file:bg-[var(--slate-600)]"
        />
        <p className="text-[11px] text-[var(--slate-500)]">PDF uniquement, {MAX_MB} Mo maximum.</p>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-[var(--blue-600)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-500)] disabled:opacity-50"
          >
            {uploading ? "Envoi en cours..." : "Publier le document"}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Documents publiés {items ? `(${items.length})` : ""}
        </h2>

        {items === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-8 text-center text-sm text-[var(--slate-500)]">
            Aucun document pour le moment.
          </div>
        ) : (
          items.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--brand-white)]">📕 {r.title}</p>
                {r.description && (
                  <p className="mt-1 text-sm text-[var(--slate-400)]">{r.description}</p>
                )}
                <p className="mt-2 text-[11px] text-[var(--slate-500)]">
                  {formatSize(r.file_size)} · ajouté le{" "}
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
