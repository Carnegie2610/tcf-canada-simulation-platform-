"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { numericToCefr } from "@/lib/admin/cefr";
import type { CefrDataPoint } from "@/lib/admin/types";

interface CefrProgressChartProps {
  dataPoints: CefrDataPoint[];
}

interface TooltipPayload {
  payload: CefrDataPoint;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--brand-white)]">{d.cefrLevel} — {d.globalScore}/100</p>
      <p className="text-[var(--slate-400)] mt-0.5">{d.examTitle}</p>
      <p className="text-[var(--slate-500)] mt-0.5">
        {new Date(d.date).toLocaleDateString("fr-CA")}
      </p>
    </div>
  );
}

export function CefrProgressChart({ dataPoints }: CefrProgressChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50">
        <p className="text-sm text-[var(--slate-500)]">
          Aucune donnée de progression disponible
        </p>
      </div>
    );
  }

  const chartData = dataPoints.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("fr-CA", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "var(--slate-400)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 6]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => numericToCefr(v) ?? String(v)}
            tick={{ fill: "var(--slate-400)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="cefrNumeric"
            stroke="var(--blue-500)"
            strokeWidth={2}
            dot={{ fill: "var(--blue-500)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
