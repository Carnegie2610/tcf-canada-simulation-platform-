import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HistoryPanel } from "@/components/organisms/student/HistoryPanel";
import { getStudentData, listCompletedCombinationsWithEvaluation } from "@/lib/student/queries";
import { CompletedCombinationCard } from "@/components/molecules/student/CompletedCombinationCard";
import { BackButton } from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [data, completedCombinations] = await Promise.all([
    getStudentData(supabase, user.id),
    listCompletedCombinationsWithEvaluation(supabase, user.id),
  ]);

  if (!data) redirect("/dashboard");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Historique &amp; Progrès
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Retrouvez toutes vos simulations complètes et suivez votre évolution CECR.
        </p>
      </div>

      {/* Completed combination cards */}
      {completedCombinations.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Simulations complétées ({completedCombinations.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedCombinations.map(({ combination, submission, evaluation }, i) => (
              <CompletedCombinationCard
                key={submission.id}
                combination={combination}
                submission={submission}
                evaluation={evaluation}
                index={i + 1}
              />
            ))}
          </div>
        </section>
      )}

      <HistoryPanel data={data} />
    </div>
  );
}
