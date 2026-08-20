"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserManagementTable } from "@/components/organisms/admin/UserManagementTable";
import { UserForm } from "@/components/molecules/admin/UserForm";
import { PaginationBar } from "@/components/atoms/PaginationBar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminProfile, AdminUserListResponse } from "@/lib/admin/types";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  async function fetchUsers(
    q?: string,
    p = page,
    st: string = status,
    rl: string = roleFilter
  ) {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(p) });
    if (q) params.set("search", q);
    if (st) params.set("status", st);
    if (rl) params.set("role", rl);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = (await res.json()) as { data: AdminUserListResponse };
    setData(json.data);
  }

  async function fetchCurrentUser() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();
    if (profile) {
      setCurrentUser({ id: profile.id as string, role: profile.role as string });
    }
  }

  const isFirstRender = useRef(true);

  useEffect(() => {
    void fetchUsers();
    void fetchCurrentUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live search — refetch automatically shortly after the user stops typing.
  // Skips the initial mount so the first page load isn't delayed by the debounce.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      setPage(1);
      void fetchUsers(search || undefined, 1);
    }, 300);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleStatusChange(next: string) {
    setStatus(next);
    setPage(1);
    void fetchUsers(search || undefined, 1, next, roleFilter);
  }

  function handleRoleChange(next: string) {
    setRoleFilter(next);
    setPage(1);
    void fetchUsers(search || undefined, 1, status, next);
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
    setRoleFilter("");
    setPage(1);
    void fetchUsers(undefined, 1, "", "");
  }

  const hasFilters = search !== "" || status !== "" || roleFilter !== "";

  function handlePageChange(p: number) {
    setPage(p);
    void fetchUsers(search || undefined, p);
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
        {currentUser?.role === "super_admin" && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors"
          >
            + Créer un utilisateur
          </button>
        )}
      </div>

      {/* Live search — refetches automatically as you type */}
      <div className="mt-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou e-mail..."
          className="w-80 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
      </div>

      <div className="mt-6">
        {data === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : (
          <>
            <UserManagementTable
              users={data.users}
              currentUserRole={(currentUser?.role ?? "admin") as AdminProfile["role"]}
              currentUserId={currentUser?.id ?? ""}
              onDeleted={() => fetchUsers(search || undefined, page)}
            />
            <PaginationBar
              total={data.total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {showCreate && (
        <UserForm
          mode="create"
          onSuccess={() => {
            setShowCreate(false);
            void fetchUsers(search || undefined, page);
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
