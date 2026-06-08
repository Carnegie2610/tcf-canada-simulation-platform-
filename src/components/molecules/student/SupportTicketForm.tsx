"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SupportTicketForm() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;
    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (error) throw error;
      setStatus("sent");
      setMessage("");
      setSubject("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-green-800/50 bg-green-900/20 px-5 py-4 text-sm text-green-400">
        Votre message a été envoyé. Un administrateur vous répondra sous peu.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[var(--slate-400)] mb-1">
          Sujet
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Problème de connexion, Question sur mon plan..."
          className="w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder-[var(--slate-600)] focus:border-[var(--blue-500)] focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--slate-400)] mb-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre problème ou posez votre question..."
          rows={4}
          className="w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2 text-sm text-[var(--brand-white)] placeholder-[var(--slate-600)] focus:border-[var(--blue-500)] focus:outline-none resize-none"
          required
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-[var(--brand-red)]">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
      <Button type="submit" size="sm" loading={status === "loading"}>
        Envoyer le message
      </Button>
    </form>
  );
}
