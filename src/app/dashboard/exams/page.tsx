import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExamPortalGrid } from "@/components/organisms/student/ExamPortalGrid";
import { listExamsWithStatus } from "@/lib/student/queries";
import { BackButton } from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("ee_simulations_quota, ee_simulations_remaining, expires_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  const examsWithStatus = await listExamsWithStatus(supabase, user.id);
  const simulationsUsed = profile.ee_simulations_quota - profile.ee_simulations_remaining;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Portail des simulations
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Catalogue complet des sujets d&apos;entraînement. Démarrez une nouvelle simulation ou reprenez une session en cours.
        </p>
      </div>
      <ExamPortalGrid
        examsWithStatus={examsWithStatus}
        simulationsUsed={simulationsUsed}
        simulationsTotal={profile.ee_simulations_quota}
        expiresAt={profile.expires_at}
      />
    </div>
  );
}
