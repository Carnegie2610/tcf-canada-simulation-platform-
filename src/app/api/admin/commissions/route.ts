import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PLAN_LABELS: Record<string, string> = {
  PLAN_2000: "Plan Starter",
  PLAN_3000: "Plan Essentiel",
  PLAN_5000: "Plan de Base",
  PLAN_10000: "Plan Pro / Premium",
  PLAN_15000: "Plan Élite / VIP",
};

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
  const PAGE_SIZE = 15;

  const { start, end } = getPeriodRange(period);

  // Period-scoped KPIs
  let kpiQuery = adminClient
    .from("payments")
    .select("commission, plan_price", { count: "exact" })
    .eq("payment_status", "confirmed");
  if (start) kpiQuery = kpiQuery.gte("created_at", start);
  if (end) kpiQuery = kpiQuery.lte("created_at", end);
  const { data: kpiRows, count: kpiCount } = await kpiQuery;

  const totalCommission = (kpiRows ?? []).reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenue = (kpiRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);
  const totalRegistrations = kpiCount ?? 0;

  // Previous day KPIs (for delta badges)
  const prev = getPreviousDayRange();
  const { data: prevRows, count: prevCount } = await adminClient
    .from("payments")
    .select("commission", { count: "exact" })
    .eq("payment_status", "confirmed")
    .gte("created_at", prev.start)
    .lte("created_at", prev.end);
  const previousDayCommission = (prevRows ?? []).reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRegistrations = prevCount ?? 0;

  // Lifetime revenue (always all-time for 3rd KPI card)
  const { data: lifetimeRows } = await adminClient
    .from("payments")
    .select("plan_price")
    .eq("payment_status", "confirmed");
  const lifetimeRevenue = (lifetimeRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);

  // Monthly trend: last 30 days grouped by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: trendRows } = await adminClient
    .from("payments")
    .select("commission, created_at")
    .eq("payment_status", "confirmed")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const trendMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of trendRows ?? []) {
    const day = row.created_at.slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + Number(row.commission));
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([date, commission]) => ({ date, commission }));

  // Plan distribution (all-time)
  const { data: distRows } = await adminClient
    .from("payments")
    .select("plan")
    .eq("payment_status", "confirmed");
  const distMap = new Map<string, number>();
  for (const row of distRows ?? []) {
    distMap.set(row.plan, (distMap.get(row.plan) ?? 0) + 1);
  }
  const planDistribution = Array.from(distMap.entries()).map(([plan, count]) => ({
    plan,
    label: PLAN_LABELS[plan] ?? plan,
    count,
  }));

  // Ledger with period + search + pagination
  let ledgerQuery = adminClient
    .from("payments")
    .select("id, created_at, student_name, student_email, plan, plan_price, commission", { count: "exact" })
    .eq("payment_status", "confirmed")
    .order("created_at", { ascending: false });

  if (start) ledgerQuery = ledgerQuery.gte("created_at", start);
  if (end) ledgerQuery = ledgerQuery.lte("created_at", end);
  if (search) {
    ledgerQuery = ledgerQuery.or(
      `student_name.ilike.%${search}%,student_email.ilike.%${search}%`
    );
  }

  ledgerQuery = ledgerQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data: ledgerRows, count: ledgerTotal } = await ledgerQuery;

  const ledger = (ledgerRows ?? []).map((r) => ({
    id: r.id as string,
    created_at: r.created_at as string,
    student_name: r.student_name as string,
    student_email: r.student_email as string,
    plan_label: PLAN_LABELS[r.plan as string] ?? (r.plan as string),
    plan_price: Number(r.plan_price),
    commission: Number(r.commission),
  }));

  return NextResponse.json({
    totalCommission,
    totalRevenue,
    totalRegistrations,
    previousDayCommission,
    previousDayRegistrations,
    lifetimeRevenue,
    monthlyTrend,
    planDistribution,
    ledger,
    ledgerTotal: ledgerTotal ?? 0,
  });
}
