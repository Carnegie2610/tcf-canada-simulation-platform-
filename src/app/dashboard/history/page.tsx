import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HistoryPanel } from "@/components/organisms/student/HistoryPanel";
import { getStudentData } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getStudentData(supabase, user.id);

  if (!data) redirect("/dashboard");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">
          Historique & Progression
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Suivez votre évolution CECR et consultez toutes vos simulations passées.
        </p>
      </div>
      <HistoryPanel data={data} />
    </div>
  );
}
