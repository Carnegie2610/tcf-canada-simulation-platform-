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
    .select("provider, success, created_at, duration_ms")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const calls = (rows ?? []) as AiApiCallRow[];

  const byProvider: Record<string, number> = {
    groq: 0, gemini: 0, openai: 0, anthropic: 0,
  };
  let totalSuccess = 0;
  let totalFailed = 0;
  const byDayMap: Record<string, number> = {};

  for (const row of calls) {
    if (row.provider in byProvider) byProvider[row.provider]++;
    if (row.success) totalSuccess++; else totalFailed++;
    const day = row.created_at.slice(0, 10);
    byDayMap[day] = (byDayMap[day] ?? 0) + 1;
  }

  const byDay = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({ byProvider, byDay, totalSuccess, totalFailed, total: calls.length });
}
