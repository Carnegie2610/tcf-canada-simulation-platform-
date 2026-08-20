import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationSource = "announcement" | "ticket_message";

export interface StudentNotification {
  id: string;
  source: NotificationSource;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** Emoji shown beside the notification. Admin-chosen for announcements. */
  icon: string;
  /** Set only when there is somewhere further to go — a ticket reply links to its
   *  conversation. Announcements are read in place, so they have no href. */
  href?: string;
}

export interface NotificationFeed {
  items: StudentNotification[];
  unreadCount: number;
}

const MAX_ITEMS = 30;

/**
 * Builds a student's notification feed from the two things that can notify them:
 * broadcast announcements, and admin replies on their own support tickets.
 *
 * Read state lives in `notification_reads` keyed by (user, source_type, source_id);
 * an item with no matching row is unread. Anything that fails here degrades to an
 * empty feed rather than throwing — a notification bell must never be able to take
 * the dashboard down with it.
 */
export async function getStudentNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationFeed> {
  try {
    const [{ data: announcements }, { data: tickets }, { data: reads }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, body, icon, created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_ITEMS),
      // Only this student's tickets are visible to them under RLS, so the admin
      // replies fetched here are inherently scoped to their own conversations.
      supabase
        .from("support_tickets")
        .select("id, subject, ticket_messages(id, body, sender_role, created_at)")
        .eq("user_id", userId),
      supabase
        .from("notification_reads")
        .select("source_type, source_id")
        .eq("user_id", userId),
    ]);

    const readKeys = new Set(
      (reads ?? []).map((r) => `${r.source_type}:${r.source_id}`)
    );

    const items: StudentNotification[] = [];

    for (const a of announcements ?? []) {
      items.push({
        id: a.id as string,
        source: "announcement",
        title: a.title as string,
        body: a.body as string,
        createdAt: a.created_at as string,
        read: readKeys.has(`announcement:${a.id}`),
        icon: (a.icon as string) || "📢",
      });
    }

    for (const t of (tickets ?? []) as unknown as {
      id: string;
      subject: string;
      ticket_messages: { id: string; body: string; sender_role: string; created_at: string }[] | null;
    }[]) {
      for (const m of t.ticket_messages ?? []) {
        if (m.sender_role !== "admin") continue;
        items.push({
          id: m.id,
          source: "ticket_message",
          title: `Réponse à votre demande : ${t.subject}`,
          body: m.body,
          createdAt: m.created_at,
          read: readKeys.has(`ticket_message:${m.id}`),
          icon: "💬",
          href: "/dashboard/tickets",
        });
      }
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const trimmed = items.slice(0, MAX_ITEMS);
    return {
      items: trimmed,
      unreadCount: trimmed.filter((i) => !i.read).length,
    };
  } catch (err) {
    console.error("[notifications] feed unavailable:", err);
    return { items: [], unreadCount: 0 };
  }
}
