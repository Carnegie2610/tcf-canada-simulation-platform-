"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExamManagementTable } from "@/components/organisms/admin/ExamManagementTable";
import { ExamForm } from "@/components/molecules/admin/ExamForm";
import { CombinationForm } from "@/components/molecules/admin/CombinationForm";
import type {
  AdminCombinationListResponse,
  AdminExamListResponse,
  Combination,
  Exam,
} from "@/lib/admin/types";

export default function ExamsPage() {
  const router = useRouter();
  const [examData, setExamData] = useState<AdminExamListResponse | null>(null);
  const [comboData, setComboData] = useState<AdminCombinationListResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateCombo, setShowCreateCombo] = useState(false);
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [section, setSection] = useState("");

  async function fetchExams(q?: string, et?: string, sec?: string) {
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("search", q);
    if (et) params.set("exam_type", et);
    if (sec) params.set("section", sec);
    const res = await fetch(`/api/admin/exams?${params}`);
    const json = (await res.json()) as { data: AdminExamListResponse };
    setExamData(json.data);
  }

  async function fetchCombinations(q?: string, et?: string) {
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("search", q);
    if (et) params.set("exam_type", et);
    const res = await fetch(`/api/admin/combinations?${params}`);
    const json = (await res.json()) as { data: AdminCombinationListResponse };
    setComboData(json.data);
  }

  function fetchAll(q?: string, et?: string, sec?: string) {
    void fetchExams(q, et, sec);
    void fetchCombinations(q, et);
  }

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchAll(search || undefined, examType || undefined, section || undefined);
  }

  const loading = examData === null || comboData === null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)]">Questions</h1>
          <p className="mt-1 text-sm text-[var(--slate-400)]">
            Gestion des sujets de simulation (TEF / TCF)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-[var(--slate-700)] px-4 py-2 text-sm font-semibold text-[var(--slate-300)] hover:text-[var(--brand-white)] transition-colors"
          >
            + Créer une question
          </button>
          <button
            onClick={() => setShowCreateCombo(true)}
            className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors"
          >
            + Créer une combinaison
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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--slate-400)]">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] focus:border-[var(--blue-500)] focus:outline-none"
          >
            <option value="">Toutes</option>
            <option value="SECTION_A">Section A</option>
            <option value="SECTION_B">Section B</option>
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
          <ExamManagementTable
            exams={examData.exams}
            combinations={comboData.combinations}
          />
        )}
      </div>

      {showCreate && (
        <ExamForm
          mode="create"
          onSuccess={(_exam: Exam) => {
            setShowCreate(false);
            fetchAll(search || undefined, examType || undefined, section || undefined);
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {showCreateCombo && (
        <CombinationForm
          mode="create"
          onSuccess={(_combo: Combination) => {
            setShowCreateCombo(false);
            fetchAll(search || undefined, examType || undefined, section || undefined);
            router.refresh();
          }}
          onCancel={() => setShowCreateCombo(false)}
        />
      )}
    </div>
  );
}
