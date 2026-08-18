import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CommissionsPage } from "@/components/organisms/admin/CommissionsPage";
import { getPlanMeta } from "@/lib/plans";

function isEoPlan(plan: string): boolean {
  return getPlanMeta(plan).skillType === "eo";
}

export default async function CommissionsAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/admin");

  const adminClient = createSupabaseAdminClient();

  // KPI all-time
  const { data: allPayments } = await adminClient
    .from("payments")
    .select("commission, plan_price, plan, created_at")
    .eq("payment_status", "confirmed");

  const rows = allPayments ?? [];
  const totalCommission = rows.reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenue = rows.reduce((s, r) => s + Number(r.plan_price), 0);
  const totalRegistrations = rows.length;
  const lifetimeRevenue = totalRevenue;
  const eoRows = rows.filter((r) => isEoPlan(r.plan as string));
  const totalCommissionEo = eoRows.reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenueEo = eoRows.reduce((s, r) => s + Number(r.plan_price), 0);

  // Previous day
  const now = new Date();
  const prevStart = new Date(now);
  prevStart.setDate(prevStart.getDate() - 1);
  prevStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(prevStart);
  prevEnd.setHours(23, 59, 59, 999);
  const { data: prevRows } = await adminClient
    .from("payments")
    .select("commission, plan_price, plan")
    .eq("payment_status", "confirmed")
    .gte("created_at", prevStart.toISOString())
    .lte("created_at", prevEnd.toISOString());
  const previousDayCommission = (prevRows ?? []).reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenue = (prevRows ?? []).reduce((s, r) => s + Number(r.plan_price), 0);
  const previousDayRegistrations = (prevRows ?? []).length;
  const eoPrevRows = (prevRows ?? []).filter((r) => isEoPlan(r.plan as string));
  const previousDayCommissionEo = eoPrevRows.reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenueEo = eoPrevRows.reduce((s, r) => s + Number(r.plan_price), 0);

  // Monthly trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const trendMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const day = (row.created_at as string).slice(0, 10);
    if (trendMap.has(day)) {
      trendMap.set(day, (trendMap.get(day) ?? 0) + Number(row.commission));
    }
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([date, commission]) => ({ date, commission }));

  // Plan distribution
  const distMap = new Map<string, number>();
  for (const row of rows) {
    distMap.set(row.plan as string, (distMap.get(row.plan as string) ?? 0) + 1);
  }
  const planDistribution = Array.from(distMap.entries()).map(([plan, count]) => ({
    plan,
    label: getPlanMeta(plan).label,
    count,
  }));

  // Ledger first page
  const { data: ledgerRows, count: ledgerTotal } = await adminClient
    .from("payments")
    .select("id, created_at, student_name, student_email, plan, plan_price, commission", { count: "exact" })
    .eq("payment_status", "confirmed")
    .order("created_at", { ascending: false })
    .range(0, 14);

  const ledger = (ledgerRows ?? []).map((r) => ({
    id: r.id as string,
    created_at: r.created_at as string,
    student_name: r.student_name as string,
    student_email: r.student_email as string,
    plan_label: getPlanMeta(r.plan as string).label,
    plan_price: Number(r.plan_price),
    commission: Number(r.commission),
  }));

  const initialData = {
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
    ledgerTotal: ledgerTotal ?? 0,
    totalCommissionEo,
    totalRevenueEo,
    previousDayCommissionEo,
    previousDayRevenueEo,
  };

  return <CommissionsPage initialData={initialData} />;
}
