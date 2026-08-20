import { SignOutButton } from "@/components/molecules/student/SignOutButton";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { AdminNavLink } from "@/components/molecules/admin/AdminNavLink";
import type { UserRole } from "@/lib/admin/types";

interface AdminShellProps {
  children: React.ReactNode;
  currentUserName: string;
  currentUserRole: UserRole;
  openTicketCount?: number;
}

const navItems = [
  { label: "Tableau de bord", href: "/admin", icon: "⊞", superAdminOnly: false },
  { label: "Auditor", href: "/admin/audit", icon: "◎", superAdminOnly: false },
  { label: "Utilisateurs", href: "/admin/users", icon: "◻", superAdminOnly: false },
  { label: "Question EE", href: "/admin/exams", icon: "✎", superAdminOnly: false },
  { label: "Question CO", href: "/admin/oral-comprehension", icon: "🎧", superAdminOnly: false },
  { label: "Question EO", href: "/admin/oral", icon: "🎙️", superAdminOnly: false },
  { label: "Question CE", href: "/admin/reading-comprehension", icon: "📖", superAdminOnly: false },
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

export function AdminShell({ children, currentUserName, currentUserRole, openTicketCount = 0 }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--slate-950)]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--slate-800)] bg-[var(--slate-900)]">
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
            .map((item) => (
              <AdminNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badgeCount={item.href === "/admin/tickets" ? openTicketCount : undefined}
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
      <main className="ml-60 flex-1 min-w-0">{children}</main>
    </div>
  );
}
