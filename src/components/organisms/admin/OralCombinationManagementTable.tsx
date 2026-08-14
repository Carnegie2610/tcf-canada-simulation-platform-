"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminTableCell } from "@/components/atoms/AdminTableCell";
import { OralCombinationForm } from "@/components/molecules/admin/OralCombinationForm";
import { ConfirmDeleteModal } from "@/components/molecules/admin/ConfirmDeleteModal";
import type { OralCombination } from "@/lib/admin/types";

interface OralCombinationManagementTableProps {
  oralCombinations: OralCombination[];
  onDeleted?: () => void;
}

export function OralCombinationManagementTable({
  oralCombinations,
  onDeleted,
}: OralCombinationManagementTableProps) {
  const router = useRouter();
  const [localCombos, setLocalCombos] = useState<OralCombination[]>(oralCombinations);
  const [editingCombo, setEditingCombo] = useState<OralCombination | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setLocalCombos(oralCombinations);
  }, [oralCombinations]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const comboChannel = supabase
      .channel("admin-oral-combos-delete")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "oral_combinations" },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (deletedId) setLocalCombos((prev) => prev.filter((c) => c.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(comboChannel);
    };
  }, []);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/oral-combinations/${deleting.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLocalCombos((prev) => prev.filter((c) => c.id !== deleting.id));
        onDeleted?.();
      }
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  const isEmpty = localCombos.length === 0;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--slate-700)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--slate-800)]">
              {["Titre", "Type", "Durée", "Tâches", "Créée le", ""].map((h) => (
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
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--slate-500)]">
                  Aucune combinaison orale trouvée.
                </td>
              </tr>
            ) : (
              localCombos.map((combo) => (
                <tr
                  key={combo.id}
                  className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/40 transition-colors"
                >
                  <AdminTableCell>
                    <span className="font-medium text-[var(--brand-white)]">{combo.title}</span>
                    <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--slate-500)]">
                      {combo.tasks.tache_1.question}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs">
                      {combo.exam_type}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>{combo.global_duration} min</AdminTableCell>
                  <AdminTableCell>
                    <span className="italic text-[var(--slate-500)]">3 tâches</span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {new Date(combo.created_at).toLocaleDateString("fr-FR")}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCombo(combo)}
                        className="rounded px-2.5 py-1 text-xs font-medium text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--brand-white)] transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleting({ id: combo.id, title: combo.title })}
                        className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </AdminTableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingCombo && (
        <OralCombinationForm
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
        title="Supprimer la combinaison orale"
        description={`Supprimer définitivement « ${deleting?.title} » ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </>
  );
}
