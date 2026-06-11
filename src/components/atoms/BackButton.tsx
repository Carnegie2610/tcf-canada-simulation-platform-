"use client";

import Link from "next/link";

interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--slate-400)] hover:text-[var(--brand-white)] transition-colors"
    >
      <span>←</span>
      <span>{label}</span>
    </Link>
  );
}
