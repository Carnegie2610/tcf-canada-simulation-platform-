import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BillingPanel } from "@/components/organisms/student/BillingPanel";
import type { AdminProfile } from "@/lib/admin/types";
import { BackButton } from "@/components/atoms/BackButton";

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Facturation & Support
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Gérez votre abonnement et contactez notre équipe de support.
        </p>
      </div>
      <BillingPanel profile={profile as AdminProfile} />
    </div>
  );
}
