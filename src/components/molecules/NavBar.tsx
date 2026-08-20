"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NavLink } from "@/components/atoms/NavLink";
import { Button } from "@/components/atoms/Button";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";

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
    <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        aria-label="Objectif 4C2 pour tous — Accueil"
        className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight whitespace-nowrap xl:mr-16"
      >
        <img
          src="/icon-rounded.png"
          alt="Objectif 4C2 Academy Logo"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
        <span className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-white)] bg-clip-text text-transparent">
          Objectif 4C2 pour tous
        </span>
      </Link>

      <ul className="hidden items-center gap-5 xl:flex" role="list">
        {navItems.map((item) => (
          <li key={item.href} className="whitespace-nowrap">
            <NavLink href={item.href} label={item.label} />
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 xl:ml-2">
        <ThemeToggle />
        <Button variant="secondary" size="sm" href="/login">
          Connexion
        </Button>
        <Button variant="primary" size="sm" href="/inscription" className="btn-glow">
          S&apos;inscrire
        </Button>

        <div className="relative xl:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu de navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--slate-700)] transition-colors hover:bg-[var(--slate-800)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-4 w-4 text-[var(--slate-300)]"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-950)] py-1 shadow-xl"
              role="list"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-[var(--slate-400)] transition-colors hover:bg-[var(--slate-800)] hover:text-[var(--slate-200)]"
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
