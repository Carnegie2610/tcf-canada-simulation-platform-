import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardStats, getDashboardFeed, getDashboardChartData } from "@/lib/admin/queries";
import type { DashboardFilter } from "@/lib/admin/types";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

const VALID_FILTERS: DashboardFilter[] = ["today", "yesterday", "before_yesterday", "all"];

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const rawFilter = request.nextUrl.searchParams.get("filter") ?? "today";
  const filter: DashboardFilter = VALID_FILTERS.includes(rawFilter as DashboardFilter)
    ? (rawFilter as DashboardFilter)
    : "today";

  const rawPage = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const [stats, feed, charts] = await Promise.all([
    getDashboardStats(supabase, filter),
    getDashboardFeed(supabase, filter, page),
    getDashboardChartData(supabase, filter),
  ]);

  return NextResponse.json({ data: { stats, feed, charts } });
}
