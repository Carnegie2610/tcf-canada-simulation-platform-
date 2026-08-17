export default function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--slate-950)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--slate-700)] border-t-blue-500" />
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--slate-500)]">
          Chargement…
        </p>
      </div>
    </div>
  );
}
