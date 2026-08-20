"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavChild {
  href: string;
  icon: string;
  label: string;
}

interface AdminNavGroupProps {
  label: string;
  icon: string;
  items: NavChild[];
}

/**
 * Collapsible sidebar group. A client island because AdminShell is a server
 * component and the toggle needs local state.
 *
 * Opens itself when one of its children is the current page, so navigating
 * straight to a grouped route never leaves the sidebar looking like that section
 * isn't there.
 */
export function AdminNavGroup({ label, icon, items }: AdminNavGroupProps) {
  const pathname = usePathname();

  const isChildActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const hasActiveChild = items.some((c) => isChildActive(c.href));
  const [open, setOpen] = useState(hasActiveChild);

  // Keep it open while a child is active, whatever the manual toggle says —
  // collapsing the section you're currently inside is disorienting.
  const expanded = open || hasActiveChild;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
          hasActiveChild
            ? "border-blue-500 bg-[var(--slate-800)]/60 text-[var(--brand-white)]"
            : "border-transparent text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)]"
        }`}
      >
        <span className="text-base">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span
          className={`text-[10px] text-[var(--slate-500)] transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-1 border-l border-[var(--slate-700)] pl-3 ml-3">
          {items.map((child) => {
            const active = isChildActive(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[var(--slate-800)] font-medium text-[var(--brand-white)]"
                    : "text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)]"
                }`}
              >
                <span className="text-sm">{child.icon}</span>
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
