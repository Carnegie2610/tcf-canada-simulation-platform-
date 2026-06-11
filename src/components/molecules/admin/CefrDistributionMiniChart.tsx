"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { CefrDistributionItem } from "@/lib/admin/types";

interface CefrDistributionMiniChartProps {
  data: CefrDistributionItem[];
}

const CEFR_COLORS: Record<string, string> = {
  A1: "#ef4444",
  A2: "#f97316",
  B1: "#eab308",
  B2: "#3b82f6",
  C1: "#10b981",
  C2: "#f59e0b",
};

export function CefrDistributionMiniChart({ data }: CefrDistributionMiniChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50">
        <p className="text-xs text-[var(--slate-500)]">Aucune évaluation</p>
      </div>
    );
  }

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="35%"
            cy="50%"
            innerRadius={28}
            outerRadius={48}
            dataKey="count"
            nameKey="level"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.level} fill={CEFR_COLORS[entry.level] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--slate-900)",
              border: "1px solid var(--slate-700)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: unknown, name: unknown) => [`${v as number}`, name as string]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={7}
            formatter={(value: string) => (
              <span style={{ color: "var(--slate-300)", fontSize: 10 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
