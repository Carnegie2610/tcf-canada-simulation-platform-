"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/src/style.css";

interface LedgerRow {
  id: string;
  created_at: string;
  student_name: string;
  student_email: string;
  plan_label: string;
  plan_price: number;
  commission: number;
}

interface TrendPoint { date: string; commissionEe: number; commissionEo: number; }
interface DistPoint { skillType: "ee" | "eo"; label: string; count: number; }

interface CommissionsData {
  totalCommission: number;
  totalRevenue: number;
  totalRegistrations: number;
  previousDayCommission: number;
  previousDayRevenue: number;
  previousDayRegistrations: number;
  lifetimeRevenue: number;
  monthlyTrend: TrendPoint[];
  planDistribution: DistPoint[];
  ledger: LedgerRow[];
  ledgerTotal: number;
  // Expression Orale plans only (PLAN_EO_*) — tracked separately from EE/mix
  // since EO carries its own 30% commission rate.
  totalCommissionEo: number;
  totalRevenueEo: number;
  previousDayCommissionEo: number;
  previousDayRevenueEo: number;
  // Expression Écrite + Mix plans (everything that isn't EO) — the flat 35% rate.
  totalCommissionEe: number;
  totalRevenueEe: number;
  previousDayCommissionEe: number;
  previousDayRevenueEe: number;
}

interface CommissionsPageProps {
  initialData: CommissionsData;
}

type Period = "today" | "yesterday" | "day-before" | "all" | "custom";

const PERIOD_LABELS: Record<Exclude<Period, "custom">, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  "day-before": "Avant-hier",
  all: "Tout",
};

// Fixed colors reused consistently across the KPI cards, line chart, and pie
// chart so EE and EO revenue are always visually identifiable at a glance.
const EE_COLOR = "#3b82f6";
const EO_COLOR = "#10b981";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " F CFA";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function deltaBadge(current: number, previous: number, isCount = false) {
  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "";
  const label = isCount ? `${sign}${diff}` : `${sign}${fmt(diff)}`;
  const color = diff >= 0 ? "text-emerald-400" : "text-red-400";
  return <span className={`text-[11px] font-semibold ${color}`}>{label} vs hier</span>;
}

export function CommissionsPage({ initialData }: CommissionsPageProps) {
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<CommissionsData>(initialData);
  const [loading, setLoading] = useState(false);

  // Custom date range state
  const [calOpen, setCalOpen] = useState(false);
  const [calRange, setCalRange] = useState<DateRange | undefined>(undefined);
  const [customDates, setCustomDates] = useState<{ from: Date; to: Date } | null>(null);
  const calRef = useRef<HTMLDivElement>(null);
  // Tracks whether the user has clicked the start date yet (two-phase selection)
  const clickPhaseRef = useRef<"first" | "second">("first");

  // Close calendar on outside click (but only when open)
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        clickPhaseRef.current = "first";
        setCalRange(undefined);
        setCalOpen(false);
      }
    }
    if (calOpen) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [calOpen]);

  const fetchData = useCallback(async (
    p: Period,
    pg: number,
    s: string,
    dateFrom?: string,
    dateTo?: string,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), search: s });
      if (p === "custom" && dateFrom && dateTo) {
        params.set("dateFrom", dateFrom);
        params.set("dateTo", dateTo);
        params.set("period", "all");
      } else {
        params.set("period", p);
      }
      const res = await fetch(`/api/admin/commissions?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as CommissionsData;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handlePeriod(p: Period) {
    setPeriod(p);
    setPage(1);
    if (p !== "custom") {
      setCustomDates(null);
      setCalRange(undefined);
      setCalOpen(false);
      void fetchData(p, 1, search);
    } else {
      // Reset phase and open calendar; don't fetch until range is complete
      clickPhaseRef.current = "first";
      setCalRange(undefined);
      setCalOpen(true);
    }
  }

  function handleCalSelect(range: DateRange | undefined) {
    if (!range?.from) return;

    if (clickPhaseRef.current === "first") {
      // First click: record start date, stay open
      setCalRange({ from: range.from, to: undefined });
      clickPhaseRef.current = "second";
      return;
    }

    // Second click: finalize the range
    const startDate = calRange?.from ?? range.from;
    const endDate = range.from;
    // Always ensure chronological order
    const [finalFrom, finalTo] = startDate <= endDate
      ? [startDate, endDate]
      : [endDate, startDate];

    setCalRange({ from: finalFrom, to: finalTo });
    setCustomDates({ from: finalFrom, to: finalTo });
    setCalOpen(false);
    clickPhaseRef.current = "first";
    setPage(1);
    void fetchData(
      "custom", 1, search,
      finalFrom.toISOString().slice(0, 10),
      finalTo.toISOString().slice(0, 10),
    );
  }

  function handleClearCustom() {
    clickPhaseRef.current = "first";
    setCustomDates(null);
    setCalRange(undefined);
    setPeriod("all");
    setPage(1);
    void fetchData("all", 1, search);
  }

  function handleSearch(s: string) {
    setSearch(s);
    setPage(1);
    if (period === "custom" && customDates) {
      void fetchData("custom", 1, s, customDates.from.toISOString().slice(0, 10), customDates.to.toISOString().slice(0, 10));
    } else {
      void fetchData(period, 1, s);
    }
  }

  function handlePage(pg: number) {
    setPage(pg);
    if (period === "custom" && customDates) {
      void fetchData("custom", pg, search, customDates.from.toISOString().slice(0, 10), customDates.to.toISOString().slice(0, 10));
    } else {
      void fetchData(period, pg, search);
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.ledgerTotal / 15));
  const now = Date.now();

  const customLabel = customDates
    ? `${fmtDate(customDates.from)} → ${fmtDate(customDates.to)}`
    : "Plage personnalisée";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--slate-200)]">Mes Commissions</h1>
        <p className="mt-1 text-sm text-[var(--slate-500)]">
          Suivi des revenus d&apos;affiliation et des transactions (35% par inscription)
        </p>
      </div>

      {/* Unified filter bar */}
      <div className="relative flex gap-2 flex-wrap items-center" ref={calRef}>
        {(Object.keys(PERIOD_LABELS) as Exclude<Period, "custom">[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriod(p)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              period === p
                ? "border-blue-600 bg-blue-700 text-white"
                : "border-[var(--slate-700)] bg-[var(--slate-800)] text-[var(--slate-200)] hover:border-[var(--slate-700)] hover:bg-[var(--slate-700)]"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}

        {/* Custom range button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePeriod("custom")}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              period === "custom"
                ? "border-blue-600 bg-blue-700 text-white"
                : "border-[var(--slate-700)] bg-[var(--slate-800)] text-[var(--slate-200)] hover:border-[var(--slate-700)] hover:bg-[var(--slate-700)]"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {customLabel}
          </button>
          {customDates && (
            <button
              onClick={handleClearCustom}
              className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-2 py-2 text-xs text-[var(--slate-400)] hover:bg-[var(--slate-700)] transition-colors"
              title="Effacer la plage"
            >
              ✕
            </button>
          )}
        </div>

        {loading && (
          <span className="flex items-center text-xs text-[var(--slate-500)] ml-2">Chargement...</span>
        )}

        {/* Calendar popover */}
        {calOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] shadow-2xl p-3">
            {clickPhaseRef.current === "first" && (
              <p className="text-[11px] text-[var(--slate-500)] mb-2 text-center">Cliquez sur la date de début</p>
            )}
            {clickPhaseRef.current === "second" && (
              <p className="text-[11px] text-amber-400 mb-2 text-center">Cliquez sur la date de fin</p>
            )}
            <DayPicker
              mode="range"
              selected={calRange}
              onSelect={handleCalSelect}
              endMonth={new Date()}
              numberOfMonths={1}
              showOutsideDays
              classNames={{
                root: "text-[var(--slate-200)] text-sm",
                months: "flex flex-col",
                month_caption: "flex justify-center items-center gap-2 py-2 text-[var(--slate-200)] font-semibold",
                nav: "flex items-center gap-1",
                button_previous: "rounded p-1 text-[var(--slate-400)] hover:text-[var(--slate-200)] hover:bg-[var(--slate-800)] transition-colors",
                button_next: "rounded p-1 text-[var(--slate-400)] hover:text-[var(--slate-200)] hover:bg-[var(--slate-800)] transition-colors",
                weeks: "w-full border-collapse",
                weekdays: "flex",
                weekday: "text-[var(--slate-500)] text-[10px] font-semibold uppercase w-9 text-center",
                week: "flex w-full mt-1",
                day: "w-9 h-9 text-center text-xs p-0",
                day_button: "w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--slate-700)] transition-colors cursor-pointer",
                selected: "bg-blue-700 text-white font-bold",
                range_start: "bg-blue-600 text-white font-bold",
                range_end: "bg-blue-600 text-white font-bold",
                range_middle: "bg-blue-900/50 text-blue-200",
                today: "text-amber-400 font-bold",
                outside: "text-[var(--slate-500)]",
                disabled: "text-[var(--slate-700)] cursor-not-allowed opacity-40",
              }}
            />
          </div>
        )}
      </div>

      {/* KPI grid — EO first, then EE, then a merged registrations+total summary card */}
      <div className="grid grid-cols-2 gap-4">
        {/* Revenus EO Principaux (30%) */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Revenus EO Principaux (30%)
          </p>
          <p className="text-2xl font-extrabold" style={{ color: EO_COLOR }}>{fmt(data.totalCommissionEo)}</p>
          {deltaBadge(data.totalCommissionEo, data.previousDayCommissionEo)}
        </div>

        {/* Revenus EO Secondaires (60%) */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Revenus EO Secondaires (60%)
          </p>
          <p className="text-2xl font-extrabold" style={{ color: EO_COLOR }}>{fmt(data.totalRevenueEo * 0.6)}</p>
          {deltaBadge(data.totalRevenueEo * 0.6, data.previousDayRevenueEo * 0.6)}
        </div>

        {/* Revenus EE Principaux (35%) */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Revenus EE Principaux (35%)
          </p>
          <p className="text-2xl font-extrabold" style={{ color: EE_COLOR }}>{fmt(data.totalCommissionEe)}</p>
          {deltaBadge(data.totalCommissionEe, data.previousDayCommissionEe)}
        </div>

        {/* Revenus EE Secondaires (65%) */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Revenus EE Secondaires (65%)
          </p>
          <p className="text-2xl font-extrabold" style={{ color: EE_COLOR }}>{fmt(data.totalRevenueEe * 0.65)}</p>
          {deltaBadge(data.totalRevenueEe * 0.65, data.previousDayRevenueEe * 0.65)}
        </div>

        {/* Merged summary: registrations + grand total revenue */}
        <div className="col-span-2 rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                Inscriptions Payées
              </p>
              <p className="text-2xl font-extrabold text-[var(--slate-200)]">{data.totalRegistrations}</p>
              {deltaBadge(data.totalRegistrations, data.previousDayRegistrations, true)}
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                Chiffre d&apos;Affaires Total
              </p>
              <p className="text-2xl font-extrabold text-[var(--slate-200)]">{fmt(data.totalRevenue)}</p>
              <span className="text-[11px] text-[var(--slate-500)]">
                {period === "all" ? "Cumul depuis le lancement" : "Sur la période sélectionnée"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Progression Mensuelle des Commissions
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlyTrend}>
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v, name) => [`${Number(v).toLocaleString("fr-FR")} F CFA`, name]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-[11px] text-[var(--slate-400)]">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="commissionEe"
                name="EE"
                stroke={EE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="commissionEo"
                name="EO"
                stroke={EO_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Répartition des Plans Vendus
          </p>
          {data.planDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[var(--slate-500)] text-sm">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.planDistribution}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.planDistribution.map((entry) => (
                    <Cell
                      key={entry.skillType}
                      fill={entry.skillType === "eo" ? EO_COLOR : EE_COLOR}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-[11px] text-[var(--slate-400)]">{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${Number(v)} inscription${Number(v) > 1 ? "s" : ""}`, String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ledger */}
      <div className="rounded-xl border border-[var(--slate-800)] bg-[var(--slate-900)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--slate-800)] bg-[var(--slate-900)] px-5 py-4">
          <p className="text-sm font-bold text-[var(--slate-200)]">Grand Livre des Commissions</p>
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1.5 text-xs text-[var(--slate-200)] placeholder-[var(--slate-500)] focus:border-blue-600 focus:outline-none w-52"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--slate-800)]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Date d&apos;inscription
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Étudiant
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Formule Choisie
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                  Ma Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--slate-500)]">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                data.ledger.map((row) => {
                  const isNew = now - new Date(row.created_at).getTime() < 30_000;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[var(--slate-800)]/50 transition-colors hover:bg-[var(--slate-800)]/40 ${
                        isNew ? "animate-pulse bg-emerald-900/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-xs text-[var(--slate-400)]">
                        {new Date(row.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-[var(--slate-200)]">{row.student_name}</p>
                        <p className="text-[10px] text-[var(--slate-500)]">{row.student_email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--slate-200)]">{row.plan_label}</td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-emerald-400">
                        {fmt(row.commission)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--slate-800)] px-5 py-3">
            <p className="text-[11px] text-[var(--slate-500)]">
              Page {page} sur {totalPages} — {data.ledgerTotal} transaction{data.ledgerTotal > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="rounded border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1 text-xs text-[var(--slate-200)] transition hover:bg-[var(--slate-700)] disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePage(page + 1)}
                disabled={page >= totalPages}
                className="rounded border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1 text-xs text-[var(--slate-200)] transition hover:bg-[var(--slate-700)] disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
