import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TicketList, type AdminTicket } from "@/components/organisms/admin/TicketList";
import { TicketCategoryManager, type TicketCategory } from "@/components/organisms/admin/TicketCategoryManager";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const supabase = await createSupabaseServerClient();

  // Admin/super_admin access is already enforced by src/app/admin/layout.tsx.
  const [{ data: rawTickets }, { data: rawCategories }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select(
        `
        id, subject, message, status, created_at,
        profile:profiles ( full_name, email ),
        category:ticket_categories ( label )
      `
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("ticket_categories")
      .select("id, label, created_at")
      .order("label", { ascending: true }),
  ]);

  const ticketIds = (rawTickets ?? []).map((t) => t.id as string);
  const { data: rawMessages } = ticketIds.length
    ? await supabase
        .from("ticket_messages")
        .select("id, ticket_id, sender_role, body, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const messagesByTicket = new Map<string, AdminTicket["messages"]>();
  for (const m of rawMessages ?? []) {
    const row = m as Record<string, unknown>;
    const ticketId = row.ticket_id as string;
    const list = messagesByTicket.get(ticketId) ?? [];
    list.push({
      id: row.id as string,
      sender_role: row.sender_role as "student" | "admin",
      body: row.body as string,
      created_at: row.created_at as string,
    });
    messagesByTicket.set(ticketId, list);
  }

  const tickets: AdminTicket[] = (rawTickets ?? []).map((row: Record<string, unknown>) => {
    const rawProfile = row.profile as { full_name: string; email: string } | { full_name: string; email: string }[] | null;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    const rawCategory = row.category as { label: string } | { label: string }[] | null;
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    return {
      id: row.id as string,
      subject: row.subject as string,
      message: row.message as string,
      status: row.status as AdminTicket["status"],
      created_at: row.created_at as string,
      student_name: profile?.full_name ?? "Utilisateur supprimé",
      student_email: profile?.email ?? "—",
      category_label: category?.label ?? null,
      messages: messagesByTicket.get(row.id as string) ?? [],
    };
  });

  const categories: TicketCategory[] = (rawCategories ?? []).map((c) => ({
    id: c.id as string,
    label: c.label as string,
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">Tickets Support</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Messages envoyés par les étudiants depuis leur page de facturation.
        </p>
      </div>

      <TicketCategoryManager initialCategories={categories} />

      <TicketList tickets={tickets} />
    </div>
  );
}
