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
import type { TaskPerformancePoint } from "@/lib/admin/types";

interface TaskPerformanceChartProps {
  data: TaskPerformancePoint[];
}

export function TaskPerformanceChart({ data }: TaskPerformanceChartProps) {
  const hasData = data.some((d) => d.avgScore !== null);

  if (!hasData) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50">
        <p className="text-xs text-[var(--slate-500)]">Aucune évaluation disponible</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.task, score: d.avgScore ?? 0 }));

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--slate-400)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fill: "var(--slate-400)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={20}
          />
          <Tooltip
            cursor={{ fill: "rgba(59,130,246,0.08)" }}
            contentStyle={{
              background: "var(--slate-900)",
              border: "1px solid var(--slate-700)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: unknown) => [`${(v as number).toFixed(1)} / 20`, "Moy."]}
          />
          <Bar dataKey="score" fill="var(--blue-500)" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
