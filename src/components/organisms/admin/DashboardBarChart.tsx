"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SubmissionsByDay } from "@/lib/admin/types";

interface DashboardBarChartProps {
  data: SubmissionsByDay[];
}

// Matches the EE/EO color pairing already used elsewhere in the admin dashboard
// (see CommissionsPage.tsx) for visual consistency across charts.
const EE_COLOR = "#3b82f6";
const EO_COLOR = "#10b981";

const SERIES_LABEL: Record<string, string> = {
  ee: "Expression Écrite",
  eo: "Expression Orale",
};

export function DashboardBarChart({ data }: DashboardBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50">
        <p className="text-sm text-[var(--slate-500)]">Aucune soumission sur cette période</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-CA", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--slate-400)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--slate-400)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            cursor={{ fill: "rgba(59,130,246,0.08)" }}
            contentStyle={{
              background: "var(--slate-900)",
              border: "1px solid var(--slate-700)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--slate-300)" }}
            itemStyle={{ color: "var(--blue-400)" }}
            formatter={(v: unknown, name: unknown) => [
              `${v as number} soumissions`,
              SERIES_LABEL[String(name)] ?? String(name),
            ]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "var(--slate-400)", fontSize: 12 }}>
                {SERIES_LABEL[value] ?? value}
              </span>
            )}
          />
          <Bar dataKey="ee" name="ee" fill={EE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="eo" name="eo" fill={EO_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
