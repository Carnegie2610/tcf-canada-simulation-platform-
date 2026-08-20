"use client";

import { useState } from "react";
import { PdfViewerModal } from "@/components/molecules/PdfViewerModal";

export interface StudentResource {
  id: string;
  title: string;
  description: string | null;
  file_size: number | null;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;
}

export function ResourceLibrary({ resources }: { resources: StudentResource[] }) {
  const [openDoc, setOpenDoc] = useState<{ url: string; title: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openResource(r: StudentResource) {
    setLoadingId(r.id);
    setError(null);
    try {
      // The bucket is private — the readable URL is minted per request and expires,
      // so it can't be fetched ahead of time or shared onward usefully.
      const res = await fetch(`/api/student/resources/${r.id}/view`);
      if (!res.ok) throw new Error("failed");
      const { url } = (await res.json()) as { url: string };
      setOpenDoc({ url, title: r.title });
    } catch {
      setError("Impossible d'ouvrir ce document. Veuillez réessayer.");
    } finally {
      setLoadingId(null);
    }
  }

  if (resources.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
        Documents à télécharger et lire
      </h2>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <button
            key={r.id}
            onClick={() => void openResource(r)}
            disabled={loadingId === r.id}
            className="group flex flex-col gap-2 rounded-2xl border-2 border-[var(--slate-700)] bg-[var(--slate-900)]/60 p-5 text-left shadow-md shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 disabled:opacity-60"
          >
            <span className="text-2xl" aria-hidden="true">📕</span>
            <span className="text-sm font-bold text-[var(--slate-200)]">{r.title}</span>
            {r.description && (
              <span className="line-clamp-2 text-xs leading-relaxed text-[var(--slate-400)]">
                {r.description}
              </span>
            )}
            <span className="mt-auto pt-2 text-xs font-medium text-[var(--accent-blue-text)]">
              {loadingId === r.id ? "Ouverture…" : `Lire ${formatSize(r.file_size)}`}
            </span>
          </button>
        ))}
      </div>

      {openDoc && (
        <PdfViewerModal
          url={openDoc.url}
          title={openDoc.title}
          onClose={() => setOpenDoc(null)}
        />
      )}

    </section>
  );
}
