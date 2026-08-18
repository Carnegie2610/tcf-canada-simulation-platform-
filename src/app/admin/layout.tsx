import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageTemplate } from "@/components/templates/AdminPageTemplate";
import type { UserRole } from "@/lib/admin/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const { count: openTicketCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <AdminPageTemplate
      currentUserName={profile.full_name ?? user.email ?? "Admin"}
      currentUserRole={profile.role as UserRole}
      openTicketCount={openTicketCount ?? 0}
    >
      {children}
    </AdminPageTemplate>
  );
}
