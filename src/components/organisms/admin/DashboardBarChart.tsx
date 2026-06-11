"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SubmissionsByDay } from "@/lib/admin/types";

interface DashboardBarChartProps {
  data: SubmissionsByDay[];
}

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
            formatter={(v: unknown) => [`${v as number} soumissions`, ""]}
          />
          <Bar dataKey="count" fill="var(--blue-600)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
