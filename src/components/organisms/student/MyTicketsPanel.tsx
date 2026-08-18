"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface MyTicketMessage {
  id: string;
  sender_role: "student" | "admin";
  body: string;
  created_at: string;
}

export interface MyTicket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  category_label: string | null;
  messages: MyTicketMessage[];
}

interface MyTicketsPanelProps {
  tickets: MyTicket[];
}

const STATUS_LABEL: Record<MyTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const STATUS_CLASS: Record<MyTicket["status"], string> = {
  open: "bg-red-950 text-red-400 border-red-900/50",
  in_progress: "bg-amber-950 text-amber-400 border-amber-900/50",
  resolved: "bg-emerald-950 text-emerald-400 border-emerald-900/50",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketThread({ ticket }: { ticket: MyTicket }) {
  const [messages, setMessages] = useState(ticket.messages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_role: "student",
          body: reply.trim(),
        })
        .select()
        .single();

      if (error || !data) return;
      setMessages((prev) => [
        ...prev,
        {
          id: data.id as string,
          sender_role: "student",
          body: data.body as string,
          created_at: data.created_at as string,
        },
      ]);
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--brand-white)]">{ticket.subject}</h3>
            {ticket.category_label && (
              <span className="rounded-full border border-[var(--slate-700)] bg-[var(--slate-800)] px-2 py-0.5 text-[10px] text-[var(--slate-400)]">
                {ticket.category_label}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--slate-500)]">Envoyé le {formatDate(ticket.created_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASS[ticket.status]}`}
        >
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--slate-800)] bg-[var(--slate-950)]/40 p-3">
        <div className="rounded-lg bg-[var(--slate-800)]/60 p-3 mr-4">
          <div className="flex items-center justify-between text-[10px] text-[var(--slate-500)]">
            <span className="font-semibold text-[var(--slate-300)]">Vous</span>
            <span>{formatDate(ticket.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
            {ticket.message}
          </p>
        </div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 ${
              m.sender_role === "admin" ? "bg-blue-950/40 ml-4" : "bg-[var(--slate-800)]/60 mr-4"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-[var(--slate-500)]">
              <span className="font-semibold text-[var(--slate-300)]">
                {m.sender_role === "admin" ? "Support Objectif 4C2" : "Vous"}
              </span>
              <span>{formatDate(m.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
              {m.body}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendReply} className="flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Ajouter un message..."
          className="flex-1 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="rounded-lg bg-[var(--blue-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-500)] transition-colors disabled:opacity-50"
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

export function MyTicketsPanel({ tickets }: MyTicketsPanelProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
        <p className="text-sm text-[var(--slate-500)]">
          Vous n&apos;avez envoyé aucun ticket pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketThread key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
