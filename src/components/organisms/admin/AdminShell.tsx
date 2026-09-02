"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/molecules/student/SignOutButton";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { AdminNavLink } from "@/components/molecules/admin/AdminNavLink";
import { AdminNavGroup } from "@/components/molecules/admin/AdminNavGroup";
import type { UserRole } from "@/lib/admin/types";

interface AdminShellProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
  openTicketCount?: number;
  pendingSignupCount?: number;
}

// The four question banks are collapsed under one "Questions" group — they share a
// purpose and were crowding the top of an otherwise flat 14-item sidebar.
const questionItems = [
  { label: "Expression Écrite", href: "/admin/exams", icon: "✎" },
  { label: "Compréhension Orale", href: "/admin/oral-comprehension", icon: "🎧" },
  { label: "Expression Orale", href: "/admin/oral", icon: "🎙️" },
  { label: "Compréhension Écrite", href: "/admin/reading-comprehension", icon: "📖" },
];

/** Rendered above the Questions group, in their existing order. */
const PRE_QUESTIONS = ["/admin", "/admin/audit", "/admin/users"];

const navItems = [
  { label: "Tableau de bord", href: "/admin", icon: "⊞", superAdminOnly: false },
  { label: "Auditor", href: "/admin/audit", icon: "◎", superAdminOnly: false },
  { label: "Utilisateurs", href: "/admin/users", icon: "◻", superAdminOnly: false },
  { label: "Demandes d'inscription", href: "/admin/signup-requests", icon: "🙋", superAdminOnly: false },
  { label: "Annonces", href: "/admin/announcements", icon: "📢", superAdminOnly: false },
  { label: "Ressources PDF", href: "/admin/resources", icon: "📕", superAdminOnly: false },
  { label: "Clés API", href: "/admin/api-keys", icon: "🔑", superAdminOnly: false },
  { label: "Tickets Support", href: "/admin/tickets", icon: "🎫", superAdminOnly: false },
  { label: "Prompts IA", href: "/admin/prompts", icon: "⌘", superAdminOnly: true },
  { label: "Mes Commissions", href: "/admin/commissions", icon: "💸", superAdminOnly: true },
];

const roleLabel: Record<UserRole, string> = {
  student: "Étudiant",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function AdminShell({
  children,
  currentUserName,
  currentUserRole,
  openTicketCount = 0,
  pendingSignupCount = 0,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[var(--slate-950)]">
      {/* Mobile top bar — hamburger + logo, hidden at md+ where the sidebar is
          always visible. */}
      <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-4 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={sidebarOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--slate-700)] text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <img src="/icon-rounded.png" alt="Objectif 4C2 Academy Logo" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <span className="truncate text-sm font-semibold text-[var(--brand-white)]">{currentUserName}</span>
      </div>

      {/* Dismissible overlay behind the drawer on mobile */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar — off-canvas drawer below md, always visible at md+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--slate-800)] bg-[var(--slate-900)] transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-[var(--slate-800)] px-5 py-4">
          <img src="/icon-rounded.png" alt="Objectif 4C2 Academy Logo" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[var(--slate-500)] uppercase tracking-widest">
              Bienvenue
            </p>
            <p className="truncate text-sm font-semibold text-[var(--brand-white)]">
              {currentUserName}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.superAdminOnly || currentUserRole === "super_admin")
            .filter((item) => PRE_QUESTIONS.includes(item.href))
            .map((item) => (
              <AdminNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                onNavigate={closeSidebar}
              />
            ))}

          <AdminNavGroup label="Questions" icon="📚" items={questionItems} onNavigate={closeSidebar} />

          {navItems
            .filter((item) => !PRE_QUESTIONS.includes(item.href))
            .filter((item) => !item.superAdminOnly || currentUserRole === "super_admin")
            .map((item) => (
              <AdminNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                onNavigate={closeSidebar}
                badgeCount={
                  item.href === "/admin/tickets"
                    ? openTicketCount
                    : item.href === "/admin/signup-requests"
                      ? pendingSignupCount
                      : undefined
                }
              />
            ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[var(--slate-800)] px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--brand-white)]">
                {currentUserName}
              </p>
              <span className="mt-1 inline-flex rounded bg-[var(--blue-600)]/20 px-2 py-0.5 text-xs font-medium text-[var(--blue-500)]">
                {roleLabel[currentUserRole]}
              </span>
            </div>
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 md:ml-60 md:pt-0">{children}</main>
    </div>
  );
}
