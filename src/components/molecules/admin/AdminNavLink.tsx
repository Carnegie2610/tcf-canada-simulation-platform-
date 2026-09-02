"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminNavLinkProps {
  href: string;
  icon: string;
  label: string;
  badgeCount?: number;
  onNavigate?: () => void;
}

export function AdminNavLink({ href, icon, label, badgeCount, onNavigate }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "border-blue-500 bg-[var(--slate-800)] text-[var(--brand-white)]"
          : "border-transparent text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)]"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badgeCount && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}
