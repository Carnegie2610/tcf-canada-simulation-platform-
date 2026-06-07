import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [{ count: totalUsers }, { count: totalSubmissions }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
  ]);

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, assigned_plan, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--brand-white)]">Tableau de bord</h1>
      <p className="mt-1 text-sm text-[var(--slate-400)]">
        Vue d&apos;ensemble de la plateforme
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Étudiants", value: totalUsers ?? 0 },
          { label: "Soumissions", value: totalSubmissions ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--slate-400)]">
              {stat.label}
            </p>
            <p className="mt-1.5 text-3xl font-bold text-[var(--brand-white)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--slate-400)]">
          Inscriptions récentes
        </h2>
        <div className="overflow-hidden rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
          {(recentUsers ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[var(--slate-500)]">
              Aucun étudiant inscrit.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--slate-800)]">
              {(recentUsers ?? []).map((u) => (
                <li key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--brand-white)]">
                      {u.full_name}
                    </p>
                    <p className="text-xs text-[var(--slate-500)]">{u.email}</p>
                  </div>
                  <span className="text-xs text-[var(--slate-500)]">
                    {new Date(u.created_at).toLocaleDateString("fr-CA")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
