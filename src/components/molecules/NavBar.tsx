"use client";

import Link from "next/link";
import { NavLink } from "@/components/atoms/NavLink";
import { Button } from "@/components/atoms/Button";

interface NavItem {
  href: string;
  label: string;
}

interface NavBarProps {
  navItems: NavItem[];
}

export function NavBar({ navItems }: NavBarProps) {
  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        aria-label="Objectif 4C2 pour tous — Accueil"
        className="flex items-center gap-2 text-lg font-black tracking-tight"
      >
        <span>🇨🇦</span>
        <span className="bg-gradient-to-r from-[--brand-red] to-[--brand-white] bg-clip-text text-transparent">
          Objectif 4C2 pour tous
        </span>
      </Link>

      <ul className="hidden items-center gap-6 md:flex" role="list">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} label={item.label} />
          </li>
        ))}
      </ul>

      <Button variant="primary" size="sm" href="/login">
        Connexion
      </Button>
    </div>
  );
}
