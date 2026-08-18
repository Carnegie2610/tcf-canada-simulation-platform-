import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudentPageTemplate } from "@/components/templates/StudentPageTemplate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, ee_simulations_quota, ee_simulations_remaining, eo_simulations_quota, eo_simulations_remaining, expires_at"
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/admin");
  }

  // Site-wide header badge shows the combined EE + EO pool; individual skill pages
  // (combinations, exams, expression-orale) gate access on their own skill's quota.
  const quotaTotal = profile.ee_simulations_quota + profile.eo_simulations_quota;
  const quotaRemaining = profile.ee_simulations_remaining + profile.eo_simulations_remaining;

  return (
    <StudentPageTemplate
      userId={user.id}
      currentUserName={profile.full_name ?? user.email ?? "Étudiant"}
      simulationsUsed={quotaTotal - quotaRemaining}
      simulationsTotal={quotaTotal}
      expiresAt={profile.expires_at}
    >
      {children}
    </StudentPageTemplate>
  );
}
