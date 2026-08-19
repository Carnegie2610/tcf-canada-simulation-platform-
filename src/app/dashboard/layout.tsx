import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudentPageTemplate } from "@/components/templates/StudentPageTemplate";
import { WhatsNewModal } from "@/components/organisms/student/WhatsNewModal";
import { shouldShowWhatsNew } from "@/lib/whats-new";

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
      "full_name, role, ee_simulations_quota, ee_simulations_remaining, eo_simulations_quota, eo_simulations_remaining, expires_at, whats_new_seen_at"
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/admin");
  }

  return (
    <StudentPageTemplate
      userId={user.id}
      currentUserName={profile.full_name ?? user.email ?? "Étudiant"}
      eeUsed={profile.ee_simulations_quota - profile.ee_simulations_remaining}
      eeTotal={profile.ee_simulations_quota}
      eoUsed={profile.eo_simulations_quota - profile.eo_simulations_remaining}
      eoTotal={profile.eo_simulations_quota}
      expiresAt={profile.expires_at}
    >
      {shouldShowWhatsNew(profile.whats_new_seen_at) && <WhatsNewModal />}
      {children}
    </StudentPageTemplate>
  );
}
