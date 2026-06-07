"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTableCell } from "@/components/atoms/AdminTableCell";
import { UserForm } from "@/components/molecules/admin/UserForm";
import { ConfirmDeleteModal } from "@/components/molecules/admin/ConfirmDeleteModal";
import type { AdminProfile, UserRole } from "@/lib/admin/types";

interface UserManagementTableProps {
  users: AdminProfile[];
  currentUserRole: UserRole;
  currentUserId: string;
}

const planLabel: Record<string, string> = {
  PLAN_5000: "5 000 F",
  PLAN_10000: "10 000 F",
  PLAN_15000: "15 000 F",
  PLAN_20000: "20 000 F",
};

export function UserManagementTable({
  users,
  currentUserRole,
  currentUserId,
}: UserManagementTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState<AdminProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/admin/users/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--slate-700)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--slate-800)]">
              {["Nom", "Email", "Rôle", "Plan", "Quota", "Expire", ""].map((h) => (
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
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-[var(--slate-500)]"
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/40 transition-colors"
                >
                  <AdminTableCell>
                    <span className="font-medium text-[var(--brand-white)]">
                      {u.full_name}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>{u.email}</AdminTableCell>
                  <AdminTableCell>
                    <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs capitalize">
                      {u.role.replace("_", " ")}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {planLabel[u.assigned_plan] ?? u.assigned_plan}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={u.simulations_remaining === 0 ? "text-red-400" : ""}>
                      {u.simulations_remaining}/{u.simulations_quota}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span
                      className={`text-xs ${
                        new Date(u.expires_at) < new Date()
                          ? "text-red-400"
                          : "text-[var(--slate-400)]"
                      }`}
                    >
                      {new Date(u.expires_at).toLocaleDateString("fr-CA")}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(u)}
                        className="rounded px-2.5 py-1 text-xs font-medium text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--brand-white)] transition-colors"
                      >
                        Modifier
                      </button>
                      {currentUserRole === "super_admin" && u.id !== currentUserId && (
                        <button
                          onClick={() => setDeleting(u)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </AdminTableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <UserForm
          mode="edit"
          initial={editing}
          onSuccess={() => { setEditing(null); router.refresh(); }}
          onCancel={() => setEditing(null)}
        />
      )}
      <ConfirmDeleteModal
        isOpen={deleting !== null}
        title="Supprimer l'utilisateur"
        description={`Supprimer définitivement « ${deleting?.full_name} » ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </>
  );
}
