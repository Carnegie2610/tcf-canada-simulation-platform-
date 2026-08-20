import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudentPageTemplate } from "@/components/templates/StudentPageTemplate";
import { getStudentNotifications } from "@/lib/student/notifications";

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

  // Fetched separately from the profile query above and failure-tolerant by
  // design: a problem building the feed must never reach the
  // `if (!profile) redirect("/login")` guard and bounce the student to login.
  const { items: notifications, unreadCount } = await getStudentNotifications(
    supabase,
    user.id
  );

  return (
    <StudentPageTemplate
      userId={user.id}
      currentUserName={profile.full_name ?? user.email ?? "Étudiant"}
      notifications={notifications}
      unreadCount={unreadCount}
      eeUsed={profile.ee_simulations_quota - profile.ee_simulations_remaining}
      eeTotal={profile.ee_simulations_quota}
      eoUsed={profile.eo_simulations_quota - profile.eo_simulations_remaining}
      eoTotal={profile.eo_simulations_quota}
      expiresAt={profile.expires_at}
    >
      {children}
    </StudentPageTemplate>
  );
}
