import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlanMeta } from "@/lib/plans";
import { groupLedgerRows, type LedgerPaymentRow } from "@/lib/admin/commissions";

function isEoPlan(plan: string): boolean {
  return getPlanMeta(plan).skillType === "eo";
}

function getPeriodRange(period: string): { start: string | null; end: string | null } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: toISO(start), end: toISO(now) };
  }
  if (period === "yesterday") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }
  if (period === "day-before") {
    const start = new Date(now);
    start.setDate(start.getDate() - 2);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }
  return { start: null, end: null };
}

function getPreviousDayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search = searchParams.get("search")?.trim() ?? "";
  const dateFrom = searchParams.get("dateFrom")?.trim() ?? "";
  const dateTo = searchParams.get("dateTo")?.trim() ?? "";
  const PAGE_SIZE = 15;

  // dateFrom/dateTo override period when both are provided
  let start: string | null;
  let end: string | null;
  if (dateFrom && dateTo) {
    start = new Date(dateFrom + "T00:00:00.000Z").toISOString();
    end = new Date(dateTo + "T23:59:59.999Z").toISOString();
  } else {
    ({ start, end } = getPeriodRange(period));
  }

  // Period-scoped KPIs
  let kpiQuery = adminClient
    .from("payments")
    .select("commission, plan_price, plan", { count: "exact" })
    .eq("payment_status", "confirmed");
  if (start) kpiQuery = kpiQuery.gte("created_at", start);
  if (end) kpiQuery = kpiQuery.lte("created_at", end);
  const { data: kpiRows, count: kpiCount } = await kpiQuery;

  const totalCommission = (kpiRows ?? []).reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenue = (kpiRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);
  const totalRegistrations = kpiCount ?? 0;
  const eoKpiRows = (kpiRows ?? []).filter((r) => isEoPlan(r.plan));
  const totalCommissionEo = eoKpiRows.reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenueEo = eoKpiRows.reduce((s, r) => s + Number(r.plan_price), 0);
  const eeKpiRows = (kpiRows ?? []).filter((r) => !isEoPlan(r.plan));
  const totalCommissionEe = eeKpiRows.reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenueEe = eeKpiRows.reduce((s, r) => s + Number(r.plan_price), 0);

  // Previous day KPIs (for delta badges)
  const prev = getPreviousDayRange();
  const { data: prevRows, count: prevCount } = await adminClient
    .from("payments")
    .select("commission, plan_price, plan", { count: "exact" })
    .eq("payment_status", "confirmed")
    .gte("created_at", prev.start)
    .lte("created_at", prev.end);
  const previousDayCommission = (prevRows ?? []).reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenue = (prevRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);
  const previousDayRegistrations = prevCount ?? 0;
  const eoPrevRows = (prevRows ?? []).filter((r) => isEoPlan(r.plan));
  const previousDayCommissionEo = eoPrevRows.reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenueEo = eoPrevRows.reduce((s, r) => s + Number(r.plan_price), 0);
  const eePrevRows = (prevRows ?? []).filter((r) => !isEoPlan(r.plan));
  const previousDayCommissionEe = eePrevRows.reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenueEe = eePrevRows.reduce((s, r) => s + Number(r.plan_price), 0);

  // Lifetime revenue (always all-time for 3rd KPI card)
  const { data: lifetimeRows } = await adminClient
    .from("payments")
    .select("plan_price")
    .eq("payment_status", "confirmed");
  const lifetimeRevenue = (lifetimeRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);

  // Monthly trend: last 30 days grouped by day — EE and EO tracked as separate series
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: trendRows } = await adminClient
    .from("payments")
    .select("commission, created_at, plan")
    .eq("payment_status", "confirmed")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const trendMap = new Map<string, { commissionEe: number; commissionEo: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), { commissionEe: 0, commissionEo: 0 });
  }
  for (const row of trendRows ?? []) {
    const day = row.created_at.slice(0, 10);
    const bucket = trendMap.get(day);
    if (bucket) {
      if (isEoPlan(row.plan)) {
        bucket.commissionEo += Number(row.commission);
      } else {
        bucket.commissionEe += Number(row.commission);
      }
    }
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Plan distribution (all-time) — grouped by skill (EE + Mix vs EO)
  const { data: distRows } = await adminClient
    .from("payments")
    .select("plan")
    .eq("payment_status", "confirmed");
  const eoDistCount = (distRows ?? []).filter((r) => isEoPlan(r.plan)).length;
  const eeDistCount = (distRows ?? []).filter((r) => !isEoPlan(r.plan)).length;
  const planDistribution = [
    { skillType: "eo" as const, label: "Expression Orale", count: eoDistCount },
    { skillType: "ee" as const, label: "Expression Écrite (+ Mix)", count: eeDistCount },
  ];

  // Ledger with period + search. Fetched unpaginated, then grouped so a student's
  // EE and EO packs from one sign-up become a single line — paginating first would
  // slice the DB rows before merging and leave pages with inconsistent counts.
  let ledgerQuery = adminClient
    .from("payments")
    .select("id, user_id, created_at, student_name, student_email, plan, plan_price, commission")
    .eq("payment_status", "confirmed")
    .order("created_at", { ascending: false });

  if (start) ledgerQuery = ledgerQuery.gte("created_at", start);
  if (end) ledgerQuery = ledgerQuery.lte("created_at", end);
  if (search) {
    ledgerQuery = ledgerQuery.or(
      `student_name.ilike.%${search}%,student_email.ilike.%${search}%`
    );
  }

  const { data: ledgerRows } = await ledgerQuery;

  const groupedLedger = groupLedgerRows((ledgerRows ?? []) as unknown as LedgerPaymentRow[]);
  const ledgerTotal = groupedLedger.length;
  const ledger = groupedLedger.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return NextResponse.json({
    totalCommission,
    totalRevenue,
    totalRegistrations,
    previousDayCommission,
    previousDayRevenue,
    previousDayRegistrations,
    lifetimeRevenue,
    monthlyTrend,
    planDistribution,
    ledger,
    ledgerTotal,
    totalCommissionEo,
    totalRevenueEo,
    previousDayCommissionEo,
    previousDayRevenueEo,
    totalCommissionEe,
    totalRevenueEe,
    previousDayCommissionEe,
    previousDayRevenueEe,
  });
}
