"use client";

/**
 * Full-screen PDF reader, shared by the student library and the admin resources
 * page so both render documents identically.
 *
 * Deliberately not wrapped in `secure-canvas-wrapper`: that shield sets
 * `pointer-events: none`, which would prevent scrolling the document at all.
 */
export function PdfViewerModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl border-2 border-b-0 border-[var(--slate-700)] bg-[var(--slate-900)] px-4 py-3">
          <p className="truncate text-sm font-bold text-[var(--brand-white)]">📕 {title}</p>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs font-medium text-[var(--slate-400)] transition-colors hover:bg-[var(--slate-800)] hover:text-[var(--slate-200)]"
          >
            ✕ Fermer
          </button>
        </div>
        <iframe
          src={url}
          title={title}
          className="h-full w-full rounded-b-xl border-2 border-t-0 border-[var(--slate-700)] bg-white"
        />
      </div>
    </div>
  );
}
