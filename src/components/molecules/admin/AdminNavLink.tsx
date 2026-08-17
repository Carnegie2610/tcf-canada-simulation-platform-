"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminNavLinkProps {
  href: string;
  icon: string;
  label: string;
}

export function AdminNavLink({ href, icon, label }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "border-blue-500 bg-[var(--slate-800)] text-[var(--brand-white)]"
          : "border-transparent text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)]"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}
