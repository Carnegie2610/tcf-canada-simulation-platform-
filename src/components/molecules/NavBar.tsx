"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" href="/login">
          Connexion
        </Button>

        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu de navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[--slate-700] hover:bg-[--slate-800] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-4 w-4 text-[--slate-300]"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[--slate-700] bg-[--slate-950] py-1 shadow-xl"
              role="list"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-[--slate-400] hover:bg-[--slate-800] hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
