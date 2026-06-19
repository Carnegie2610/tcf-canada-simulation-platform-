import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, role: profile.role as string };
}

interface AiApiCallRow {
  provider: string;
  model: string;
  success: boolean;
  created_at: string;
  duration_ms: number | null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const adminClient = createSupabaseAdminClient();
  const { data: rows } = await adminClient
    .from("ai_api_calls")
    .select("provider, model, success, created_at, duration_ms")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const calls = (rows ?? []) as AiApiCallRow[];

  const byProvider: Record<string, number> = {
    groq: 0, gemini: 0, openai: 0, anthropic: 0,
  };

  const providerDetails: Record<string, {
    total: number;
    success: number;
    failed: number;
    models: Record<string, number>;
    avgDurationMs: number | null;
  }> = {};

  let totalSuccess = 0;
  let totalFailed = 0;
  const byDayMap: Record<string, number> = {};

  for (const row of calls) {
    if (row.provider in byProvider) byProvider[row.provider]++;

    if (!providerDetails[row.provider]) {
      providerDetails[row.provider] = { total: 0, success: 0, failed: 0, models: {}, avgDurationMs: null };
    }
    const pd = providerDetails[row.provider];
    pd.total++;
    if (row.success) { pd.success++; totalSuccess++; } else { pd.failed++; totalFailed++; }
    if (row.model) pd.models[row.model] = (pd.models[row.model] ?? 0) + 1;

    const day = row.created_at.slice(0, 10);
    byDayMap[day] = (byDayMap[day] ?? 0) + 1;
  }

  // Compute avg duration per provider from successful calls with duration
  for (const row of calls) {
    if (row.success && row.duration_ms != null) {
      const pd = providerDetails[row.provider];
      if (pd) {
        pd.avgDurationMs = pd.avgDurationMs == null
          ? row.duration_ms
          : Math.round((pd.avgDurationMs + row.duration_ms) / 2);
      }
    }
  }

  const byDay = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({ byProvider, providerDetails, byDay, totalSuccess, totalFailed, total: calls.length });
}
