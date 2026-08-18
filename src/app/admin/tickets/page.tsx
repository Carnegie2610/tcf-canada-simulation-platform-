import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TicketList, type AdminTicket } from "@/components/organisms/admin/TicketList";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const supabase = await createSupabaseServerClient();

  // Admin/super_admin access is already enforced by src/app/admin/layout.tsx.
  const { data: rawTickets } = await supabase
    .from("support_tickets")
    .select(
      `
      id, subject, message, status, created_at,
      profile:profiles ( full_name, email )
    `
    )
    .order("created_at", { ascending: false });

  const tickets: AdminTicket[] = (rawTickets ?? []).map((row: Record<string, unknown>) => {
    const rawProfile = row.profile as { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    return {
      id: row.id as string,
      subject: row.subject as string,
      message: row.message as string,
      status: row.status as AdminTicket["status"],
      created_at: row.created_at as string,
      student_name: profile?.full_name ?? "Utilisateur supprimé",
      student_email: profile?.email ?? "—",
    };
  });

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Tickets Support</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Messages envoyés par les étudiants depuis leur page de facturation.
        </p>
      </div>

      <div className="mt-6">
        <TicketList tickets={tickets} />
      </div>
    </div>
  );
}
