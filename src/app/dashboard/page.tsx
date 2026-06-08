import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardQuadrantGrid } from "@/components/organisms/student/DashboardQuadrantGrid";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("simulations_quota, simulations_remaining")
    .eq("id", user.id)
    .single();

  const simulationsUsed = (profile?.simulations_quota ?? 0) - (profile?.simulations_remaining ?? 0);
  const simulationsTotal = profile?.simulations_quota ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Bienvenue sur votre espace de préparation TEF/TCF Canada.
        </p>
      </div>
      <DashboardQuadrantGrid
        simulationsUsed={simulationsUsed}
        simulationsTotal={simulationsTotal}
      />
    </div>
  );
}
