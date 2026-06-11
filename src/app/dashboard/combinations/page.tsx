import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CombinationGrid } from "@/components/organisms/student/CombinationGrid";
import { listCombinationsWithStatus } from "@/lib/student/queries";
import { BackButton } from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

export default async function CombinationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("simulations_quota, simulations_remaining, expires_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  const combinationsWithStatus = await listCombinationsWithStatus(supabase, user.id);
  const simulationsUsed = profile.simulations_quota - profile.simulations_remaining;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Combinaisons
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Simulez l&apos;examen complet TEF/TCF Canada avec 3 tâches d&apos;expression écrite en temps réel.
        </p>
      </div>
      <CombinationGrid
        combinationsWithStatus={combinationsWithStatus}
        simulationsUsed={simulationsUsed}
        simulationsTotal={profile.simulations_quota}
        expiresAt={profile.expires_at}
      />
    </div>
  );
}
