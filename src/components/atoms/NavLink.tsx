"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
}

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative text-base transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[--brand-red] after:transition-transform hover:text-[--slate-200] hover:after:scale-x-100 ${
        isActive ? "text-[--slate-200] after:scale-x-100" : "text-[--slate-400]"
      }`}
    >
      {label}
    </Link>
  );
}
