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
    .select("full_name, role, simulations_quota, simulations_remaining, expires_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "admin" || profile.role === "super_admin") {
    redirect("/admin");
  }

  return (
    <StudentPageTemplate
      currentUserName={profile.full_name ?? user.email ?? "Étudiant"}
      simulationsUsed={profile.simulations_quota - profile.simulations_remaining}
      simulationsTotal={profile.simulations_quota}
      expiresAt={profile.expires_at}
    >
      {children}
    </StudentPageTemplate>
  );
}
