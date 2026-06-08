import Link from "next/link";
import { SignOutButton } from "@/components/molecules/student/SignOutButton";

interface StudentPageTemplateProps {
  children: React.ReactNode;
  currentUserName: string;
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

const navItems = [
  { label: "Tableau de bord", href: "/dashboard", icon: "⊞" },
  { label: "Simulations", href: "/dashboard/exams", icon: "✎" },
  { label: "Historique", href: "/dashboard/history", icon: "◎" },
  { label: "Ressources", href: "/dashboard/library", icon: "◻" },
  { label: "Mon compte", href: "/dashboard/billing", icon: "◈" },
];

export function StudentPageTemplate({
  children,
  currentUserName,
  simulationsUsed,
  simulationsTotal,
  expiresAt,
}: StudentPageTemplateProps) {
  const expiryDate = new Date(expiresAt).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-[var(--slate-950)]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--slate-800)] bg-[var(--slate-900)]">
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-[var(--slate-800)] px-5 py-4">
          <span className="text-[var(--brand-red)] font-bold text-lg">4C2</span>
          <span className="text-xs font-medium text-[var(--slate-400)] uppercase tracking-widest">
            Espace étudiant
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
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

        {/* User info + quota */}
        <div className="border-t border-[var(--slate-800)] px-5 py-4 space-y-3">
          <div>
            <p className="truncate text-sm font-medium text-[var(--brand-white)]">
              {currentUserName}
            </p>
            <p className="mt-0.5 text-xs text-[var(--slate-500)]">
              Expire le {expiryDate}
            </p>
          </div>

          {/* Quota mini-bar */}
          <div>
            <p className="text-xs text-[var(--slate-400)] mb-1">
              {simulationsUsed} / {simulationsTotal} simulations
            </p>
            <div className="h-1.5 w-full rounded-full bg-[var(--slate-800)]">
              <div
                className="h-1.5 rounded-full bg-[var(--brand-red)] transition-all"
                style={{
                  width: `${simulationsTotal > 0 ? Math.min(100, (simulationsUsed / simulationsTotal) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-w-0">{children}</main>
    </div>
  );
}
