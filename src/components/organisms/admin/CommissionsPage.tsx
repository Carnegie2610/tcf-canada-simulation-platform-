"use client";

import { useState, useCallback } from "react";
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

interface LedgerRow {
  id: string;
  created_at: string;
  student_name: string;
  student_email: string;
  plan_label: string;
  plan_price: number;
  commission: number;
}

interface TrendPoint { date: string; commission: number; }
interface DistPoint { plan: string; label: string; count: number; }

interface CommissionsData {
  totalCommission: number;
  totalRevenue: number;
  totalRegistrations: number;
  previousDayCommission: number;
  previousDayRegistrations: number;
  lifetimeRevenue: number;
  monthlyTrend: TrendPoint[];
  planDistribution: DistPoint[];
  ledger: LedgerRow[];
  ledgerTotal: number;
}

interface CommissionsPageProps {
  initialData: CommissionsData;
}

type Period = "today" | "yesterday" | "day-before" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  "day-before": "Avant-hier",
  all: "Tout",
};

const DONUT_COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " F CFA";
}

function deltaBadge(current: number, previous: number, isCount = false) {
  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "";
  const label = isCount
    ? `${sign}${diff}`
    : `${sign}${fmt(diff)}`;
  const color = diff >= 0 ? "text-emerald-400" : "text-red-400";
  return <span className={`text-[11px] font-semibold ${color}`}>{label} vs hier</span>;
}

export function CommissionsPage({ initialData }: CommissionsPageProps) {
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<CommissionsData>(initialData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (p: Period, pg: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: p, page: String(pg), search: s });
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
    void fetchData(p, 1, search);
  }

  function handleSearch(s: string) {
    setSearch(s);
    setPage(1);
    void fetchData(period, 1, s);
  }

  function handlePage(pg: number) {
    setPage(pg);
    void fetchData(period, pg, search);
  }

  const totalPages = Math.max(1, Math.ceil(data.ledgerTotal / 15));
  const now = Date.now();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100">Mes Commissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Suivi des revenus d&apos;affiliation et des transactions (35% par inscription)
        </p>
      </div>

      {/* Temporal filter bar */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriod(p)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              period === p
                ? "border-blue-600 bg-blue-700 text-white"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {loading && (
          <span className="flex items-center text-xs text-slate-500 ml-2">Chargement...</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Mes Gains (Période)
          </p>
          <p className="text-2xl font-extrabold text-cyan-400">{fmt(data.totalCommission)}</p>
          {deltaBadge(data.totalCommission, data.previousDayCommission)}
        </div>
        {/* Card 2 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Inscriptions Payées
          </p>
          <p className="text-2xl font-extrabold text-slate-100">{data.totalRegistrations}</p>
          {deltaBadge(data.totalRegistrations, data.previousDayRegistrations, true)}
        </div>
        {/* Card 3 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Revenue Total Généré
          </p>
          <p className="text-2xl font-extrabold text-slate-100">{fmt(data.lifetimeRevenue)}</p>
          <span className="text-[11px] text-slate-600">Cumul depuis le lancement</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
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
                formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} F CFA`, "Commission"]}
              />
              <Line
                type="monotone"
                dataKey="commission"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Répartition des Plans Vendus
          </p>
          {data.planDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">
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
                  {data.planDistribution.map((_, index) => (
                    <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-[11px] text-slate-400">{value}</span>
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-sm font-bold text-slate-100">Grand Livre des Commissions</p>
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-600 focus:outline-none w-52"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Date d&apos;inscription
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Étudiant
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Formule Choisie
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Ma Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-600">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                data.ledger.map((row) => {
                  const isNew = now - new Date(row.created_at).getTime() < 30_000;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/40 ${
                        isNew ? "animate-pulse bg-emerald-900/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(row.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-slate-200">{row.student_name}</p>
                        <p className="text-[10px] text-slate-500">{row.student_email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-300">{row.plan_label}</td>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
            <p className="text-[11px] text-slate-500">
              Page {page} sur {totalPages} — {data.ledgerTotal} transaction{data.ledgerTotal > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePage(page + 1)}
                disabled={page >= totalPages}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
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
