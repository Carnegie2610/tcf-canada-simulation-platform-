import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_PROMPT_KEYS = ["combination_evaluation", "single_evaluation"];

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role, id").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden — super_admin only" }, { status: 403 }) };
  }
  return { user, userId: profile.id as string };
}

interface PatchBody { prompt_text: string; }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return auth.error;

  const { key } = await params;
  if (!ALLOWED_PROMPT_KEYS.includes(key)) {
    return NextResponse.json({ error: "prompt_key_not_allowed" }, { status: 400 });
  }

  const body = (await request.json()) as PatchBody;
  if (!body.prompt_text?.trim()) {
    return NextResponse.json({ error: "prompt_text_required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("ai_prompts").upsert(
    {
      prompt_key: key,
      prompt_text: body.prompt_text.trim(),
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    },
    { onConflict: "prompt_key" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
