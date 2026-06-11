interface PaginationBarProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ total, page, pageSize, onPageChange }: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 pt-3">
      <p className="text-xs text-[var(--slate-500)]">
        {total} résultat{total > 1 ? "s" : ""} — page {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-[var(--slate-700)] px-3 py-1 text-xs text-[var(--slate-400)] hover:text-[var(--brand-white)] disabled:opacity-40 transition-colors"
        >
          ← Précédent
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-[var(--slate-700)] px-3 py-1 text-xs text-[var(--slate-400)] hover:text-[var(--brand-white)] disabled:opacity-40 transition-colors"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
