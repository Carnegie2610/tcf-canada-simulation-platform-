import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PromptEditor } from "@/components/organisms/admin/PromptEditor";
import {
  TACHE_1_EVALUATION_DEFAULT,
  TACHE_1_EVALUATION_PRESETS,
  TACHE_2_EVALUATION_DEFAULT,
  TACHE_2_EVALUATION_PRESETS,
  TACHE_3_EVALUATION_DEFAULT,
  TACHE_3_EVALUATION_PRESETS,
  SINGLE_EVALUATION_DEFAULT,
  SINGLE_EVALUATION_PRESETS,
  type PromptPreset,
} from "@/lib/ai/prompts";

interface AiPromptRow {
  prompt_key: string;
  prompt_text: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

const PROMPT_DEFAULTS: Record<string, { default: string; presets: PromptPreset[] }> = {
  tache_1_evaluation: {
    default: TACHE_1_EVALUATION_DEFAULT,
    presets: TACHE_1_EVALUATION_PRESETS,
  },
  tache_2_evaluation: {
    default: TACHE_2_EVALUATION_DEFAULT,
    presets: TACHE_2_EVALUATION_PRESETS,
  },
  tache_3_evaluation: {
    default: TACHE_3_EVALUATION_DEFAULT,
    presets: TACHE_3_EVALUATION_PRESETS,
  },
  single_evaluation: {
    default: SINGLE_EVALUATION_DEFAULT,
    presets: SINGLE_EVALUATION_PRESETS,
  },
};

export default async function PromptsPage() {
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
  const { data: rows } = await adminClient
    .from("ai_prompts")
    .select("prompt_key, prompt_text, description, updated_at, updated_by")
    .order("prompt_key");

  const prompts = (rows ?? []) as AiPromptRow[];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-100">Éditeur de Prompts IA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modifiez les instructions système envoyées au modèle d&apos;IA lors de chaque évaluation.
          Les modifications prennent effet immédiatement, sans redéploiement.
        </p>
      </div>
      <PromptEditor prompts={prompts} promptDefaults={PROMPT_DEFAULTS} />
    </div>
  );
}
