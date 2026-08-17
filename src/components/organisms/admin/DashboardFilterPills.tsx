"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DashboardFilter } from "@/lib/admin/types";

const PILLS: { label: string; value: DashboardFilter }[] = [
  { label: "Aujourd'hui", value: "today" },
  { label: "Hier", value: "yesterday" },
  { label: "Avant-hier", value: "before_yesterday" },
  { label: "Tout", value: "all" },
];

const VALID: DashboardFilter[] = ["today", "yesterday", "before_yesterday", "all", "custom"];
const STORAGE_KEY = "admin_dashboard_filter";

export function DashboardFilterPills() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") ?? "") as DashboardFilter;
  const currentDate = searchParams.get("date") ?? "";

  useEffect(() => {
    if (!searchParams.get("filter")) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.includes(stored as DashboardFilter)) {
        router.replace(`/admin?filter=${stored}`, { scroll: false });
      } else {
        router.replace("/admin?filter=today", { scroll: false });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(value: DashboardFilter) {
    localStorage.setItem(STORAGE_KEY, value);
    router.replace(`/admin?filter=${value}`, { scroll: false });
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, "custom");
    router.replace(`/admin?filter=custom&date=${value}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PILLS.map(({ label, value }) => {
        const isActive = current === value;
        return (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            className={
              isActive
                ? "rounded-lg border border-blue-500 bg-blue-600 px-4 py-1.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] scale-105 transition-all duration-300"
                : "rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-4 py-1.5 text-sm text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--slate-200)] transition-all duration-200"
            }
          >
            {label}
          </button>
        );
      })}

      {/* Custom date picker */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--slate-500)]">ou</span>
        <input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none ${
            current === "custom"
              ? "border-blue-500 bg-blue-600/10 text-[var(--slate-200)]"
              : "border-[var(--slate-700)] bg-[var(--slate-800)] text-[var(--slate-400)] hover:bg-[var(--slate-700)] hover:text-[var(--slate-200)]"
          }`}
        />
      </div>
    </div>
  );
}
