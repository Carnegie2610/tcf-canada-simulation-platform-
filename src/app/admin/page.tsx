import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardStats, getDashboardFeed, getDashboardChartData } from "@/lib/admin/queries";
import { DashboardFilterPills } from "@/components/organisms/admin/DashboardFilterPills";
import { DashboardStatCards } from "@/components/organisms/admin/DashboardStatCards";
import { DashboardBarChart } from "@/components/organisms/admin/DashboardBarChart";
import { DashboardDonutChart } from "@/components/organisms/admin/DashboardDonutChart";
import { ActivityFeedTable } from "@/components/organisms/admin/ActivityFeedTable";
import type { DashboardFilter } from "@/lib/admin/types";

const VALID_FILTERS: DashboardFilter[] = ["today", "yesterday", "before_yesterday", "all", "custom"];

interface SearchParams {
  filter?: string;
  page?: string;
  date?: string;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawFilter = params.filter ?? "today";
  const filter: DashboardFilter = VALID_FILTERS.includes(rawFilter as DashboardFilter)
    ? (rawFilter as DashboardFilter)
    : "today";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const date = filter === "custom" ? (params.date ?? undefined) : undefined;

  const supabase = await createSupabaseServerClient();

  const [stats, feed, charts] = await Promise.all([
    getDashboardStats(supabase, filter, date),
    getDashboardFeed(supabase, filter, page, date),
    getDashboardChartData(supabase, filter, date),
  ]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Tableau de bord</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Temporal filter pills */}
      <Suspense fallback={
        <div className="flex gap-2">
          {["Aujourd'hui", "Hier", "Avant-hier", "Tout"].map((l) => (
            <div key={l} className="h-8 w-24 animate-pulse rounded-lg bg-[var(--slate-800)]" />
          ))}
        </div>
      }>
        <DashboardFilterPills />
      </Suspense>

      {/* Stat cards */}
      <DashboardStatCards stats={stats} filter={filter} />

      {/* Analytics charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
            Volume de soumissions (période active)
          </p>
          <DashboardBarChart data={charts.byDay} />
        </div>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
            Distribution des niveaux CECRL
          </p>
          <DashboardDonutChart data={charts.cefrDistribution} />
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
          Flux d&apos;activité unifiée
        </p>
        <ActivityFeedTable
          rows={feed.rows}
          total={feed.total}
          currentPage={page}
          filter={filter}
          date={date}
        />
      </div>
    </div>
  );
}
