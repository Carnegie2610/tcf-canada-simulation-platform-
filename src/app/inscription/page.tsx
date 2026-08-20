"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicPageTemplate } from "@/components/templates/PublicPageTemplate";

export default function InscriptionPage() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "duplicate" | "error">("idle");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/signup-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 409) return setStatus("duplicate");
      if (!res.ok) return setStatus("error");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <PublicPageTemplate>
      <section className="mx-auto w-full max-w-xl px-4 py-20">
        {status === "sent" ? (
          <div className="rounded-2xl border-2 border-emerald-700/50 bg-emerald-950/20 p-8 text-center">
            <p className="text-3xl" aria-hidden="true">✅</p>
            <h1 className="mt-3 font-(family-name:--font-sora) text-2xl font-bold text-[var(--slate-200)]">
              Demande envoyée
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--slate-400)]">
              Merci {form.full_name.split(" ")[0]} ! Votre demande d&apos;inscription a bien
              été reçue. Notre équipe l&apos;examine et vous contactera à{" "}
              <span className="font-semibold text-[var(--slate-200)]">{form.email}</span>{" "}
              pour finaliser votre accès et choisir votre formule.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="font-(family-name:--font-sora) text-3xl font-bold tracking-tight text-[var(--slate-200)]">
                Créer mon compte
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--slate-400)]">
                Remplissez ce formulaire pour demander votre accès. Un membre de
                l&apos;équipe validera votre inscription et vous accompagnera dans le
                choix de votre formule.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4 rounded-2xl border-2 border-[var(--slate-700)] bg-[var(--slate-900)] p-6"
            >
              <Field label="Nom complet *">
                <input
                  required
                  minLength={2}
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Jean Dupont"
                  className={inputCls}
                />
              </Field>

              <Field label="Adresse e-mail *">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="jean.dupont@email.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Téléphone / WhatsApp">
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className={inputCls}
                />
              </Field>

              <Field label="Votre objectif (optionnel)">
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Ex : je vise le NCLC 9 pour ma demande de résidence permanente, examen prévu en octobre."
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {status === "duplicate" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                  Une demande est déjà en cours pour cette adresse e-mail. Notre équipe
                  vous recontactera très prochainement.
                </p>
              )}
              {status === "error" && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  Une erreur est survenue. Veuillez réessayer.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === "loading" ? "Envoi en cours..." : "Envoyer ma demande"}
              </button>

              <p className="text-center text-xs text-[var(--slate-500)]">
                Vous avez déjà un compte ?{" "}
                <Link href="/login" className="text-[var(--accent-blue-text)] hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </>
        )}
      </section>
    </PublicPageTemplate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--slate-400)]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none";
