"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserManagementTable } from "@/components/organisms/admin/UserManagementTable";
import { UserForm } from "@/components/molecules/admin/UserForm";
import type { AdminProfile, AdminUserListResponse } from "@/lib/admin/types";

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchUsers(q?: string) {
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("search", q);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = (await res.json()) as { data: AdminUserListResponse };
    setData(json.data);
  }

  async function fetchCurrentUser() {
    const res = await fetch("/api/admin/users?pageSize=1");
    if (res.ok) {
      const r = (await res.json()) as { data: AdminUserListResponse };
      if (r.data.users.length > 0) {
        const me = r.data.users[0];
        setCurrentUser({ id: me.id, role: me.role });
      }
    }
  }

  useEffect(() => {
    void fetchUsers();
    void fetchCurrentUser();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void fetchUsers(search);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-[var(--slate-400)]">
            Gestion des comptes étudiants et administrateurs
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors"
        >
          + Créer un utilisateur
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou e-mail..."
          className="w-80 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--slate-700)] px-4 py-2 text-sm font-medium text-[var(--slate-300)] hover:bg-[var(--slate-600)] transition-colors"
        >
          Rechercher
        </button>
      </form>

      <div className="mt-6">
        {data === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : (
          <UserManagementTable
            users={data.users}
            currentUserRole={(currentUser?.role ?? "admin") as AdminProfile["role"]}
            currentUserId={currentUser?.id ?? ""}
          />
        )}
      </div>

      {showCreate && (
        <UserForm
          mode="create"
          onSuccess={() => {
            setShowCreate(false);
            void fetchUsers(search || undefined);
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
