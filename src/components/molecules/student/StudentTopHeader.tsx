"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface StudentTopHeaderProps {
  userId: string;
  currentUserName: string;
  simulationsUsed: number;
  simulationsTotal: number;
  expiresAt: string;
}

const navItems = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Simulations", href: "/dashboard/exams" },
  { label: "Combinaisons", href: "/dashboard/combinations" },
  { label: "Historique", href: "/dashboard/history" },
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
            simulations_quota: number;
            simulations_remaining: number;
            expires_at: string;
          };
          setTotal(row.simulations_quota);
          setUsed(row.simulations_quota - row.simulations_remaining);
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
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleSignOut() {
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
      {/* Left: Brand + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-[var(--brand-red)] text-base leading-none">4C2</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)] sm:block">
            Objectif
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-3 py-2 text-xs text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] transition-colors lg:hidden"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-xs text-[var(--slate-500)] hover:bg-[var(--slate-800)] hover:text-[var(--slate-300)] transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
