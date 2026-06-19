import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_KEYS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "ACTIVE_AI_PROVIDER",
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role, id").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, role: profile.role as string };
}

interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  target: string[];
  type: string;
}

interface VercelEnvListResponse {
  envs: VercelEnvVar[];
}

async function fetchVercelEnvs(): Promise<VercelEnvVar[] | null> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as VercelEnvListResponse;
  return data.envs ?? [];
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return NextResponse.json({ error: "vercel_not_configured", configured: false }, { status: 200 });
  }

  const envs = await fetchVercelEnvs();
  if (!envs) {
    return NextResponse.json({ error: "vercel_fetch_failed" }, { status: 502 });
  }

  const status: Record<AllowedKey, { configured: boolean; envId: string | null; isDecryptable: boolean }> = {
    GEMINI_API_KEY: { configured: false, envId: null, isDecryptable: false },
    GROQ_API_KEY: { configured: false, envId: null, isDecryptable: false },
    OPENAI_API_KEY: { configured: false, envId: null, isDecryptable: false },
    ANTHROPIC_API_KEY: { configured: false, envId: null, isDecryptable: false },
    ACTIVE_AI_PROVIDER: { configured: false, envId: null, isDecryptable: false },
  };

  let activeProvider: string | null = null;

  let activeProviderEnvId: string | null = null;

  for (const env of envs) {
    if (ALLOWED_KEYS.includes(env.key as AllowedKey)) {
      const k = env.key as AllowedKey;
      status[k] = { configured: true, envId: env.id, isDecryptable: env.type !== "encrypted" };
      if (k === "ACTIVE_AI_PROVIDER") {
        if (env.type !== "encrypted") {
          activeProvider = env.value;
        } else {
          activeProviderEnvId = env.id;
        }
      }
    }
  }

  // Decrypt ACTIVE_AI_PROVIDER if it was stored encrypted
  if (!activeProvider && activeProviderEnvId) {
    const decryptRes = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env/${activeProviderEnvId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (decryptRes.ok) {
      const decrypted = (await decryptRes.json()) as { value?: string };
      activeProvider = decrypted.value ?? null;
    }
  }

  return NextResponse.json({ configured: true, status, activeProvider });
}

interface SetEnvBody {
  key: string;
  value: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return NextResponse.json({ error: "vercel_not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as SetEnvBody;
  if (!ALLOWED_KEYS.includes(body.key as AllowedKey)) {
    return NextResponse.json({ error: "key_not_allowed" }, { status: 400 });
  }
  if (!body.value?.trim()) {
    return NextResponse.json({ error: "value_required" }, { status: 400 });
  }

  // Check if key already exists to decide create vs update
  const envs = await fetchVercelEnvs();
  if (!envs) return NextResponse.json({ error: "vercel_fetch_failed" }, { status: 502 });

  const existing = envs.find((e) => e.key === body.key);

  const payload = {
    key: body.key,
    value: body.value,
    type: "encrypted",
    target: ["production", "preview"],
  };

  let res: Response;
  if (existing) {
    res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ value: body.value, target: ["production", "preview"] }),
    });
  } else {
    res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "vercel_update_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, action: existing ? "updated" : "created" });
}
