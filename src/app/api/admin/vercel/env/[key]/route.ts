import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_KEYS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "ACTIVE_AI_PROVIDER",
];

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, role: profile.role as string };
}

interface VercelEnvVar { id: string; key: string; }
interface VercelEnvListResponse { envs: VercelEnvVar[]; }

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: "key_not_allowed" }, { status: 400 });
  }

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return NextResponse.json({ error: "vercel_not_configured" }, { status: 503 });
  }

  // Find the env var ID first
  const listRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) return NextResponse.json({ error: "vercel_fetch_failed" }, { status: 502 });

  const data = (await listRes.json()) as VercelEnvListResponse;
  const existing = data.envs?.find((e) => e.key === key);
  if (!existing) return NextResponse.json({ error: "key_not_found" }, { status: 404 });

  const delRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env/${existing.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!delRes.ok) return NextResponse.json({ error: "vercel_delete_failed" }, { status: 502 });

  return NextResponse.json({ ok: true });
}
