"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OralCombinationManagementTable } from "@/components/organisms/admin/OralCombinationManagementTable";
import { OralCombinationForm } from "@/components/molecules/admin/OralCombinationForm";
import { PaginationBar } from "@/components/atoms/PaginationBar";
import type { AdminOralCombinationListResponse, OralCombination } from "@/lib/admin/types";

const PAGE_SIZE = 20;

export default function OralCombinationsPage() {
  const router = useRouter();
  const [comboData, setComboData] = useState<AdminOralCombinationListResponse | null>(null);
  const [showCreateCombo, setShowCreateCombo] = useState(false);
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [comboPage, setComboPage] = useState(1);

  async function fetchOralCombinations(q?: string, et?: string, page = comboPage) {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page) });
    if (q) params.set("search", q);
    if (et) params.set("exam_type", et);
    const res = await fetch(`/api/admin/oral-combinations?${params}`);
    const json = (await res.json()) as { data: AdminOralCombinationListResponse };
    setComboData(json.data);
  }

  useEffect(() => {
    void fetchOralCombinations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setComboPage(1);
    void fetchOralCombinations(search || undefined, examType || undefined, 1);
  }

  function handleComboPageChange(page: number) {
    setComboPage(page);
    void fetchOralCombinations(search || undefined, examType || undefined, page);
  }

  const loading = comboData === null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)]">Question EO</h1>
          <p className="mt-1 text-sm text-[var(--slate-400)]">
            Gestion des sujets de simulation d&apos;expression orale (TEF / TCF)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateCombo(true)}
            className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors"
          >
            + Créer une combinaison orale
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--slate-400)]">Titre</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-64 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--slate-400)]">Type</label>
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
        <button
          type="submit"
          className="rounded-lg bg-[var(--slate-700)] px-4 py-2 text-sm font-medium text-[var(--slate-300)] hover:bg-[var(--slate-600)] transition-colors"
        >
          Filtrer
        </button>
      </form>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : (
          <>
            <OralCombinationManagementTable
              oralCombinations={comboData.oralCombinations}
              onDeleted={() =>
                fetchOralCombinations(search || undefined, examType || undefined, comboPage)
              }
            />
            <div className="mt-2 space-y-1">
              <PaginationBar
                total={comboData.total}
                page={comboPage}
                pageSize={PAGE_SIZE}
                onPageChange={handleComboPageChange}
              />
            </div>
          </>
        )}
      </div>

      {showCreateCombo && (
        <OralCombinationForm
          mode="create"
          onSuccess={(_combo: OralCombination) => {
            setShowCreateCombo(false);
            void fetchOralCombinations(search || undefined, examType || undefined, comboPage);
            router.refresh();
          }}
          onCancel={() => setShowCreateCombo(false)}
        />
      )}
    </div>
  );
}
