"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function StudentSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [examType, setExamType] = useState(searchParams.get("exam_type") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (examType) params.set("exam_type", examType);
    router.push(`/admin/audit?${params.toString()}`);
  }

  function handleReset() {
    setSearch("");
    setExamType("");
    router.push("/admin/audit");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--slate-400)]">
          Rechercher un étudiant
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom ou e-mail..."
          className="w-72 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--slate-400)]">
          Type d&apos;examen
        </label>
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] focus:border-[var(--blue-500)] focus:outline-none"
        >
          <option value="">Tous</option>
          <option value="TEF">TEF</option>
          <option value="TCF">TCF</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--blue-500)] transition-colors"
        >
          Rechercher
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm font-medium text-[var(--slate-400)] hover:text-[var(--brand-white)] transition-colors"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
