"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";

interface StudentTopHeaderProps {
  userId: string;
  currentUserName: string;
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

const navItems = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "CO", href: "/dashboard/simulation" },
  { label: "CE", href: "/dashboard/simulation" },
  { label: "EE", href: "/dashboard/combinations" },
  { label: "EO", href: "/dashboard/expression-orale" },
  { label: "Historique & Progrès", href: "/dashboard/history" },
  { label: "Ressources", href: "/dashboard/library" },
  { label: "Mon compte", href: "/dashboard/billing" },
];

function computeDaysLeft(expiresAt: string): number {
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatExpiryFull(expiresAt: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(expiresAt));
}

export function StudentTopHeader({
  userId,
  currentUserName,
  simulationsUsed: initialUsed,
  simulationsTotal: initialTotal,
  expiresAt,
}: StudentTopHeaderProps) {
  const router = useRouter();
  const [used, setUsed] = useState(initialUsed);
  const [total, setTotal] = useState(initialTotal);
  const [daysLeft, setDaysLeft] = useState(() => computeDaysLeft(expiresAt));
  const [expiryStr, setExpiryStr] = useState(expiresAt);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Recalculate days once per minute
  useEffect(() => {
    const id = setInterval(() => setDaysLeft(computeDaysLeft(expiryStr)), 60_000);
    return () => clearInterval(id);
  }, [expiryStr]);

  // Supabase Realtime — stream live quota/expiry changes
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`profile-header-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            ee_simulations_quota: number;
            ee_simulations_remaining: number;
            eo_simulations_quota: number;
            eo_simulations_remaining: number;
            expires_at: string;
          };
          const quotaTotal = row.ee_simulations_quota + row.eo_simulations_quota;
          const quotaRemaining = row.ee_simulations_remaining + row.eo_simulations_remaining;
          setTotal(quotaTotal);
          setUsed(quotaTotal - quotaRemaining);
          setExpiryStr(row.expires_at);
          setDaysLeft(computeDaysLeft(row.expires_at));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleSignOut() {
    setSignOutLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Badge colour helpers
  const usageRatio = total > 0 ? used / total : 0;
  const simulationsBadgeClass =
    usageRatio >= 1
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : usageRatio >= 0.95
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-blue-600/20 text-blue-400 border-blue-500/30";

  const daysBadgeClass =
    daysLeft === 0
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : daysLeft <= 7
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-[var(--slate-800)] text-[var(--slate-300)] border-[var(--slate-700)]";

  const firstName = currentUserName.split(" ")[0];
  const expiryFull = formatExpiryFull(expiryStr);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-4 sm:px-6">
      {/* Left: Brand + Nav (desktop) */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
          <img src="/icon-rounded.png" alt="Objectif 4C2 Academy Logo" width={40} height={40} className="h-10 w-10 object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right: Live badges + user dropdown */}
      <div className="flex items-center gap-2">
        {/* Expiry badge — full on desktop, short on mobile */}
        <span
          className={`rounded border px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 ${daysBadgeClass}`}
          title={`Expire le ${expiryFull}`}
        >
          <span className="hidden lg:inline">🕒 Expire le {expiryFull} ({daysLeft}&nbsp;j. restants)</span>
          <span className="lg:hidden">{daysLeft}&nbsp;j. restants</span>
        </span>

        {/* Simulations counter badge */}
        <span
          className={`rounded border px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1 ${simulationsBadgeClass}`}
        >
          {used}&thinsp;/&thinsp;{total}
          <span className="hidden sm:inline"> simulations</span>
        </span>

        <ThemeToggle />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1.5 text-xs font-medium text-[var(--slate-200)] hover:bg-[var(--slate-700)] transition-colors"
          >
            <span className="max-w-[100px] truncate">{firstName}</span>
            <span className="text-[var(--slate-500)]">▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] py-1 shadow-xl">
              <div className="px-3 py-2 border-b border-[var(--slate-800)]">
                <p className="truncate text-xs font-medium text-[var(--brand-white)]">{currentUserName}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signOutLoading}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--slate-500)] hover:bg-[var(--slate-800)] hover:text-[var(--slate-300)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signOutLoading && (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {signOutLoading ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          )}
        </div>

        {/* Hamburger nav menu (mobile) */}
        <div className="relative lg:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu de navigation"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--slate-700)] hover:bg-[var(--slate-800)] transition-colors"
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
              className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] py-1 shadow-xl"
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-xs text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
