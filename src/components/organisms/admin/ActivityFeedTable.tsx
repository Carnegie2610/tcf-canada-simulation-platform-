"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityFeedRow, DashboardFilter } from "@/lib/admin/types";

const PLAN_LABEL: Record<string, string> = {
  PLAN_2000:  "Starter (2 000 CFA)",
  PLAN_3000:  "Essentiel (3 000 CFA)",
  PLAN_5000:  "Base (5 000 CFA)",
  PLAN_10000: "Premium (10 000 CFA)",
  PLAN_15000: "Avancé (15 000 CFA)",
  PLAN_20000: "Elite (20 000 CFA)",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayD = new Date(now);
  yesterdayD.setDate(now.getDate() - 1);

  if (d.toDateString() === todayStr) {
    return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  }
  if (d.toDateString() === yesterdayD.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-CA");
}

interface ActivityFeedTableProps {
  rows: ActivityFeedRow[];
  total: number;
  currentPage: number;
  filter: DashboardFilter;
  date?: string;
}

export function ActivityFeedTable({ rows, total, currentPage, filter, date }: ActivityFeedTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / 20);

  function goPage(page: number) {
    const params = new URLSearchParams({ filter, page: String(page) });
    if (filter === "custom" && date) params.set("date", date);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[var(--slate-700)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--slate-800)]">
              {["Étudiant", "Formule / Plan", "Quota restant", "Sujet / Examen", "Créé le", "Expiration", "Action"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--slate-900)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--slate-500)]">
                  Aucune activité sur cette période.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.submissionId}
                  className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--brand-white)]">{row.fullName}</p>
                    <p className="text-xs text-[var(--slate-500)]">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--slate-300)]">
                    {PLAN_LABEL[row.assignedPlan] ?? row.assignedPlan}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${row.simulationsRemaining === 0 ? "text-red-400" : "text-[var(--slate-300)]"}`}>
                      {row.simulationsRemaining} / {row.simulationsQuota} restants
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--slate-300)]">
                    {row.combinationTitle}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--slate-400)]">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--slate-400)]">
                    {new Date(row.expiresAt).toLocaleDateString("fr-CA")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/audit/${row.userId}`}
                      className="rounded border border-[var(--slate-600)] bg-[var(--slate-800)] px-2.5 py-1 text-xs font-medium text-[var(--slate-300)] hover:border-blue-500 hover:text-blue-400 transition-colors"
                    >
                      🔍 Auditer
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[var(--slate-500)]">
            {total} résultats — page {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => goPage(currentPage - 1)}
              className="rounded border border-[var(--slate-700)] px-3 py-1 text-xs text-[var(--slate-400)] hover:text-[var(--brand-white)] disabled:opacity-40 transition-colors"
            >
              ← Précédent
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => goPage(currentPage + 1)}
              className="rounded border border-[var(--slate-700)] px-3 py-1 text-xs text-[var(--slate-400)] hover:text-[var(--brand-white)] disabled:opacity-40 transition-colors"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
