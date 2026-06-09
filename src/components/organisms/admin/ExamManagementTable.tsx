"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTableCell } from "@/components/atoms/AdminTableCell";
import { ExamForm } from "@/components/molecules/admin/ExamForm";
import { CombinationForm } from "@/components/molecules/admin/CombinationForm";
import { ConfirmDeleteModal } from "@/components/molecules/admin/ConfirmDeleteModal";
import type { Combination, Exam } from "@/lib/admin/types";

interface ExamManagementTableProps {
  exams: Exam[];
  combinations: Combination[];
}

export function ExamManagementTable({ exams, combinations }: ExamManagementTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Exam | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combination | null>(null);
  const [deleting, setDeleting] = useState<{
    id: string;
    title: string;
    kind: "exam" | "combo";
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const url =
        deleting.kind === "exam"
          ? `/api/admin/exams/${deleting.id}`
          : `/api/admin/combinations/${deleting.id}`;
      await fetch(url, { method: "DELETE" });
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  const isEmpty = exams.length === 0 && combinations.length === 0;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--slate-700)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--slate-800)]">
              {["Titre", "Section", "Type", "Min. mots", "Durée", ""].map((h) => (
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
            {isEmpty ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-[var(--slate-500)]"
                >
                  Aucune question ou combinaison trouvée.
                </td>
              </tr>
            ) : (
              <>
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/40 transition-colors"
                  >
                    <AdminTableCell>
                      <span className="font-medium text-[var(--brand-white)]">
                        {exam.title}
                      </span>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--slate-500)]">
                        {exam.prompt_text}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs">
                        {exam.section.replace("_", " ")}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs">
                        {exam.exam_type}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>{exam.min_words} mots</AdminTableCell>
                    <AdminTableCell>{exam.max_duration} min</AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(exam)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--brand-white)] transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() =>
                            setDeleting({ id: exam.id, title: exam.title, kind: "exam" })
                          }
                          className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}

                {combinations.map((combo) => (
                  <tr
                    key={combo.id}
                    className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/40 transition-colors"
                  >
                    <AdminTableCell>
                      <span className="font-medium text-[var(--brand-white)]">
                        {combo.title}
                      </span>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--slate-500)]">
                        {combo.tasks.tache_1.question}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs italic text-[var(--slate-400)]">
                        Combinaison
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs">
                        {combo.exam_type}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="italic text-[var(--slate-500)]">3 tâches</span>
                    </AdminTableCell>
                    <AdminTableCell>{combo.global_duration} min</AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCombo(combo)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--brand-white)] transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() =>
                            setDeleting({ id: combo.id, title: combo.title, kind: "combo" })
                          }
                          className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ExamForm
          mode="edit"
          initial={editing}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {editingCombo && (
        <CombinationForm
          mode="edit"
          initial={editingCombo}
          onSuccess={() => {
            setEditingCombo(null);
            router.refresh();
          }}
          onCancel={() => setEditingCombo(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleting !== null}
        title={
          deleting?.kind === "combo" ? "Supprimer la combinaison" : "Supprimer la question"
        }
        description={`Supprimer définitivement « ${deleting?.title} » ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </>
  );
}
