"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LiveQuotaBarProps {
  userId: string;
  initialEeQuota: number;
  initialEeRemaining: number;
  initialEoQuota: number;
  initialEoRemaining: number;
  expiresAt: string;
}

function computeDaysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function QuotaProgressRow({ label, quota, remaining }: { label: string; quota: number; remaining: number }) {
  const used = quota - remaining;
  const fillPct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[var(--slate-400)]">
        <span>{label}</span>
        <span className="font-medium text-[var(--slate-300)]">
          {used} / {quota} simulations complétées ({remaining} restantes)
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--slate-700)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            remaining === 0 ? "bg-red-500" : fillPct >= 80 ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

export function LiveQuotaBar({
  userId,
  initialEeQuota,
  initialEeRemaining,
  initialEoQuota,
  initialEoRemaining,
  expiresAt,
}: LiveQuotaBarProps) {
  const [eeQuota, setEeQuota] = useState(initialEeQuota);
  const [eeRemaining, setEeRemaining] = useState(initialEeRemaining);
  const [eoQuota, setEoQuota] = useState(initialEoQuota);
  const [eoRemaining, setEoRemaining] = useState(initialEoRemaining);
  const [daysLeft, setDaysLeft] = useState(() => computeDaysLeft(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setDaysLeft(computeDaysLeft(expiresAt)), 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`profile-admin-quota-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const row = payload.new as {
            ee_simulations_quota: number;
            ee_simulations_remaining: number;
            eo_simulations_quota: number;
            eo_simulations_remaining: number;
          };
          setEeQuota(row.ee_simulations_quota);
          setEeRemaining(row.ee_simulations_remaining);
          setEoQuota(row.eo_simulations_quota);
          setEoRemaining(row.eo_simulations_remaining);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const expiryAlarm = daysLeft < 7;

  return (
    <div className="space-y-3">
      {/* Expiry countdown */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--slate-400)]">Expiration du compte</span>
        <span className={expiryAlarm ? "animate-pulse font-semibold text-red-400" : "font-medium text-[var(--slate-300)]"}>
          {daysLeft === 0
            ? "Expiré"
            : `${daysLeft} jour${daysLeft !== 1 ? "s" : ""} restant${daysLeft !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Quota progress bars — EE and EO tracked independently */}
      <QuotaProgressRow label="Progrès quota EE" quota={eeQuota} remaining={eeRemaining} />
      <QuotaProgressRow label="Progrès quota EO" quota={eoQuota} remaining={eoRemaining} />
    </div>
  );
}
