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
  const eeRows = rows.filter((r) => !isEoPlan(r.plan as string));
  const totalCommissionEe = eeRows.reduce((s, r) => s + Number(r.commission), 0);
  const totalRevenueEe = eeRows.reduce((s, r) => s + Number(r.plan_price), 0);

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
  const eePrevRows = (prevRows ?? []).filter((r) => !isEoPlan(r.plan as string));
  const previousDayCommissionEe = eePrevRows.reduce((s, r) => s + Number(r.commission), 0);
  const previousDayRevenueEe = eePrevRows.reduce((s, r) => s + Number(r.plan_price), 0);

  // Monthly trend — EE and EO tracked as separate series
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const trendMap = new Map<string, { commissionEe: number; commissionEo: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), { commissionEe: 0, commissionEo: 0 });
  }
  for (const row of rows) {
    const day = (row.created_at as string).slice(0, 10);
    const bucket = trendMap.get(day);
    if (bucket) {
      if (isEoPlan(row.plan as string)) {
        bucket.commissionEo += Number(row.commission);
      } else {
        bucket.commissionEe += Number(row.commission);
      }
    }
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Plan distribution — grouped by skill (EE + Mix vs EO) rather than per individual plan
  const planDistribution = [
    { skillType: "eo" as const, label: "Expression Orale", count: eoRows.length },
    { skillType: "ee" as const, label: "Expression Écrite (+ Mix)", count: eeRows.length },
  ];

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
    totalCommissionEe,
    totalRevenueEe,
    previousDayCommissionEe,
    previousDayRevenueEe,
  };

  return <CommissionsPage initialData={initialData} />;
}
