import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/admin/queries";
import { StudentSearchBar } from "@/components/molecules/admin/StudentSearchBar";
import { StudentResultRow } from "@/components/molecules/admin/StudentResultRow";
import { Suspense } from "react";

interface SearchParams {
  search?: string;
  exam_type?: string;
  page?: string;
}

export default async function AuditorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const hasSearch = Boolean(params.search || params.exam_type);

  const result = hasSearch
    ? await listUsers(supabase, {
        search: params.search,
        exam_type: params.exam_type as "TEF" | "TCF" | undefined,
        page: Number(params.page ?? 1),
        pageSize: 20,
      })
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--brand-white)]">Auditor performance</h1>
      <p className="mt-1 text-sm text-[var(--slate-400)]">
        Recherchez un étudiant pour inspecter ses soumissions et ses progrès.
      </p>

      <div className="mt-6">
        <Suspense>
          <StudentSearchBar />
        </Suspense>
      </div>

      <div className="mt-8">
        {!hasSearch ? (
          <div className="flex items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/50 py-16">
            <p className="text-sm text-[var(--slate-500)]">
              Saisissez un nom ou un e-mail pour lancer la recherche.
            </p>
          </div>
        ) : (result?.users.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/50 py-16">
            <p className="text-sm text-[var(--slate-500)]">Aucun étudiant trouvé.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--slate-700)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--slate-800)]">
                  {["Nom", "Email", "Plan", "Quota", "Cohorte", "Expire", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-[var(--slate-900)]">
                {result!.users.map((u) => (
                  <StudentResultRow key={u.id} profile={u} />
                ))}
              </tbody>
            </table>
            {result!.total > 20 && (
              <div className="border-t border-[var(--slate-700)] px-5 py-3 text-xs text-[var(--slate-500)]">
                {result!.total} résultats — affichage des 20 premiers.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
