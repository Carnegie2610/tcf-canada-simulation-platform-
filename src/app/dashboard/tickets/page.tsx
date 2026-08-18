import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MyTicketsPanel, type MyTicket } from "@/components/organisms/student/MyTicketsPanel";
import { BackButton } from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawTickets } = await supabase
    .from("support_tickets")
    .select(
      `
      id, subject, message, status, created_at,
      category:ticket_categories ( label )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ticketIds = (rawTickets ?? []).map((t) => t.id as string);
  const { data: rawMessages } = ticketIds.length
    ? await supabase
        .from("ticket_messages")
        .select("id, ticket_id, sender_role, body, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const messagesByTicket = new Map<string, MyTicket["messages"]>();
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

  const tickets: MyTicket[] = (rawTickets ?? []).map((row: Record<string, unknown>) => {
    const rawCategory = row.category as { label: string } | { label: string }[] | null;
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    return {
      id: row.id as string,
      subject: row.subject as string,
      message: row.message as string,
      status: row.status as MyTicket["status"],
      created_at: row.created_at as string,
      category_label: category?.label ?? null,
      messages: messagesByTicket.get(row.id as string) ?? [],
    };
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard/billing" label="Mon compte" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">Mes tickets</h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Suivez vos demandes de support et échangez avec l&apos;équipe.
        </p>
      </div>

      <MyTicketsPanel tickets={tickets} />
    </div>
  );
}
