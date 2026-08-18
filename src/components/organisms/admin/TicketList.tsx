"use client";

import { useState } from "react";

export interface AdminTicket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  student_name: string;
  student_email: string;
}

interface TicketListProps {
  tickets: AdminTicket[];
}

const STATUS_LABEL: Record<AdminTicket["status"], string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const STATUS_CLASS: Record<AdminTicket["status"], string> = {
  open: "bg-red-950 text-red-400 border-red-900/50",
  in_progress: "bg-amber-950 text-amber-400 border-amber-900/50",
  resolved: "bg-emerald-950 text-emerald-400 border-emerald-900/50",
};

const STATUS_OPTIONS: AdminTicket["status"][] = ["open", "in_progress", "resolved"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketCard({
  ticket,
  onStatusChange,
}: {
  ticket: AdminTicket;
  onStatusChange: (id: string, status: AdminTicket["status"]) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(ticket.status);

  async function handleStatusChange(next: AdminTicket["status"]) {
    if (next === status || updating) return;
    setUpdating(true);
    const previous = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      onStatusChange(ticket.id, next);
    } catch {
      setStatus(previous);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--brand-white)]">{ticket.subject}</h3>
          <p className="mt-0.5 text-xs text-[var(--slate-500)]">
            {ticket.student_name} — {ticket.student_email}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="text-sm text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
        {ticket.message}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--slate-800)] pt-3">
        <span className="text-xs text-[var(--slate-500)]">Envoyé le {formatDate(ticket.created_at)}</span>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              disabled={updating || opt === status}
              onClick={() => handleStatusChange(opt)}
              className="rounded-lg border border-[var(--slate-700)] px-3 py-1.5 text-xs font-medium text-[var(--slate-300)] transition-colors hover:bg-[var(--slate-800)] hover:text-[var(--brand-white)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {STATUS_LABEL[opt]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TicketList({ tickets }: TicketListProps) {
  const [localTickets, setLocalTickets] = useState(tickets);

  function handleStatusChange(id: string, status: AdminTicket["status"]) {
    setLocalTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  if (localTickets.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
        <p className="text-sm text-[var(--slate-500)]">Aucun message reçu pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localTickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} onStatusChange={handleStatusChange} />
      ))}
    </div>
  );
}
