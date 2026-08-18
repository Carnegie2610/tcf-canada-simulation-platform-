import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HistoryPanel } from "@/components/organisms/student/HistoryPanel";
import {
  getStudentData,
  listCompletedCombinationsWithEvaluation,
  listCompletedOralCombinationsWithEvaluation,
} from "@/lib/student/queries";
import { CompletedCombinationCard } from "@/components/molecules/student/CompletedCombinationCard";
import { CompletedOralCombinationCard } from "@/components/molecules/student/CompletedOralCombinationCard";
import { BackButton } from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

type SkillFilter = "EE" | "EO" | undefined;

interface Props {
  searchParams: Promise<{ skill?: string }>;
}

function SkillFilterPills({
  active,
  eeCount,
  eoCount,
}: {
  active: SkillFilter;
  eeCount: number;
  eoCount: number;
}) {
  const pills: { label: string; value: SkillFilter; count: number }[] = [
    { label: "Tout", value: undefined, count: eeCount + eoCount },
    { label: "Expression Écrite", value: "EE", count: eeCount },
    { label: "Expression Orale", value: "EO", count: eoCount },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => {
        const isActive = pill.value === active;
        const href = pill.value ? `/dashboard/history?skill=${pill.value}` : "/dashboard/history";
        return (
          <Link
            key={pill.label}
            href={href}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-blue-500 bg-blue-600/20 text-blue-300"
                : "border-[var(--slate-700)] bg-[var(--slate-900)] text-[var(--slate-400)] hover:bg-[var(--slate-800)] hover:text-[var(--slate-200)]"
            }`}
          >
            {pill.label} ({pill.count})
          </Link>
        );
      })}
    </div>
  );
}

export default async function HistoryPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { skill: rawSkill } = await searchParams;
  const skill: SkillFilter = rawSkill === "EE" || rawSkill === "EO" ? rawSkill : undefined;

  const [data, completedCombinations, completedOralCombinations] = await Promise.all([
    getStudentData(supabase, user.id),
    listCompletedCombinationsWithEvaluation(supabase, user.id),
    listCompletedOralCombinationsWithEvaluation(supabase, user.id),
  ]);

  if (!data) redirect("/dashboard");

  const showEe = skill === undefined || skill === "EE";
  const showEo = skill === undefined || skill === "EO";

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

      <SkillFilterPills
        active={skill}
        eeCount={completedCombinations.length}
        eoCount={completedOralCombinations.length}
      />

      {/* Completed EE combination cards */}
      {showEe && completedCombinations.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Expression Écrite — Simulations complétées ({completedCombinations.length})
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

      {/* Completed EO combination cards */}
      {showEo && completedOralCombinations.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Expression Orale — Simulations complétées ({completedOralCombinations.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedOralCombinations.map(({ combination, submission, evaluation }, i) => (
              <CompletedOralCombinationCard
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

      {showEe && showEo && completedCombinations.length === 0 && completedOralCombinations.length === 0 && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
          <p className="text-sm text-[var(--slate-500)]">Aucune simulation complétée pour le moment.</p>
        </div>
      )}

      {/* Single-exam (EE) analytics + attempt list — EE-only data, hidden under the EO filter */}
      {showEe && <HistoryPanel data={data} />}
    </div>
  );
}
