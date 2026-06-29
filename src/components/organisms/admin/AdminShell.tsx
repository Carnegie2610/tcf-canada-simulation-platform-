import Link from "next/link";
import { SignOutButton } from "@/components/molecules/student/SignOutButton";
import type { UserRole } from "@/lib/admin/types";

interface AdminShellProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
}

const navItems = [
  { label: "Tableau de bord", href: "/admin", icon: "⊞", superAdminOnly: false },
  { label: "Auditor", href: "/admin/audit", icon: "◎", superAdminOnly: false },
  { label: "Utilisateurs", href: "/admin/users", icon: "◻", superAdminOnly: false },
  { label: "Questions", href: "/admin/exams", icon: "✎", superAdminOnly: false },
  { label: "Clés API", href: "/admin/api-keys", icon: "🔑", superAdminOnly: false },
  { label: "Prompts IA", href: "/admin/prompts", icon: "⌘", superAdminOnly: true },
  { label: "Mes Commissions", href: "/admin/commissions", icon: "💸", superAdminOnly: true },
];

const roleLabel: Record<UserRole, string> = {
  student: "Étudiant",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function AdminShell({ children, currentUserName, currentUserRole }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--slate-950)]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--slate-800)] bg-[var(--slate-900)]">
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-[var(--slate-800)] px-5 py-4">
          <img src="/4c2-logo.svg" alt="Objectif 4C2 Academy Logo" className="h-8 w-8 object-contain" />
          <span className="text-xs font-medium text-[var(--slate-400)] uppercase tracking-widest">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.superAdminOnly || currentUserRole === "super_admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] transition-colors"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-[var(--slate-800)] px-5 py-4 space-y-3">
          <div>
            <p className="truncate text-sm font-medium text-[var(--brand-white)]">
              {currentUserName}
            </p>
            <span className="mt-1 inline-flex rounded bg-[var(--blue-600)]/20 px-2 py-0.5 text-xs font-medium text-[var(--blue-500)]">
              {roleLabel[currentUserRole]}
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-w-0">{children}</main>
    </div>
  );
}
