"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageTemplate } from "@/components/templates/AuthPageTemplate";
import { Button } from "@/components/atoms/Button";
import {
  PLAN_CONFIG,
  ADMIN_ONLY_PLAN_CONFIG,
  EO_PLAN_CONFIG,
} from "@/lib/plans";

// Same catalogue the admin sees, minus the internal grouping — an applicant just
// picks what they want; the admin confirms it at approval.
const EE_PLANS = { ...ADMIN_ONLY_PLAN_CONFIG, ...PLAN_CONFIG };
const EO_PLANS = { ...EO_PLAN_CONFIG };

function planLabel(v: { label: string; price: number; eeQuota: number; eoQuota: number; skillType: string }) {
  const sims = v.skillType === "eo" ? `${v.eoQuota} sim.` : `${v.eeQuota} sim.`;
  return `${v.label} — ${v.price.toLocaleString("fr-FR")} F (${sims})`;
}

export default function InscriptionPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
    desired_plan_ee: "",
    desired_plan_eo: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "duplicate" | "error">("idle");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const noPlanChosen = !form.desired_plan_ee && !form.desired_plan_eo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/signup-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          desired_plan_ee: form.desired_plan_ee || null,
          desired_plan_eo: form.desired_plan_eo || null,
        }),
      });
      if (res.status === 409) return setStatus("duplicate");
      if (!res.ok) return setStatus("error");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <AuthPageTemplate showHeading={false}>
        <div className="space-y-4 text-center">
          <p className="text-3xl" aria-hidden="true">✅</p>
          <h2 className="text-base font-semibold text-[var(--slate-100)]">Demande envoyée</h2>
          <p className="text-sm leading-relaxed text-[var(--slate-400)]">
            Merci {form.full_name.split(" ")[0]} ! Notre équipe examine votre demande et
            vous contactera à{" "}
            <span className="font-semibold text-[var(--slate-200)]">{form.email}</span>{" "}
            pour finaliser votre accès.
          </p>
          <Button href="/" className="w-full justify-center">
            Retour à l&apos;accueil
          </Button>
        </div>
      </AuthPageTemplate>
    );
  }

  return (
    <AuthPageTemplate wide showHeading={false}>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--slate-100)]">Créer mon compte</h2>
          <p className="mt-1 text-sm text-[var(--slate-400)]">
            Remplissez ce formulaire pour demander votre accès. Un membre de
            l&apos;équipe validera votre inscription et vous accompagnera.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet">
            <input
              required
              minLength={2}
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Jean Dupont"
              className={inputCls}
            />
          </Field>

          <Field label="Adresse e-mail">
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

          <div className="space-y-3 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-950)]/60 p-4">
            <p className="text-sm font-medium text-[var(--slate-200)]">
              Quelle formule vous intéresse ?
            </p>
            <p className="text-xs text-[var(--slate-500)]">
              Choisissez l&apos;écrit, l&apos;oral, ou les deux. Rien n&apos;est définitif —
              vous pourrez en discuter avec notre équipe.
            </p>

            <Field label="Expression Écrite">
              <select
                value={form.desired_plan_ee}
                onChange={(e) => set("desired_plan_ee", e.target.value)}
                className={inputCls}
              >
                <option value="">Aucun pour le moment</option>
                {Object.entries(EE_PLANS).map(([key, v]) => (
                  <option key={key} value={key}>{planLabel(v)}</option>
                ))}
              </select>
            </Field>

            <Field label="Expression Orale">
              <select
                value={form.desired_plan_eo}
                onChange={(e) => set("desired_plan_eo", e.target.value)}
                className={inputCls}
              >
                <option value="">Aucun pour le moment</option>
                {Object.entries(EO_PLANS).map(([key, v]) => (
                  <option key={key} value={key}>{planLabel(v)}</option>
                ))}
              </select>
            </Field>

            {noPlanChosen && (
              <p className="text-xs text-[var(--slate-500)]">
                Vous pouvez aussi laisser ce choix à plus tard.
              </p>
            )}
          </div>

          <Field label="Votre objectif (optionnel)">
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Ex : je vise le NCLC 9, examen prévu en octobre."
              className={`${inputCls} resize-none`}
            />
          </Field>

          {status === "duplicate" && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              Une demande est déjà en cours pour cette adresse e-mail. Notre équipe
              vous recontactera très prochainement.
            </div>
          )}
          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Une erreur est survenue. Veuillez réessayer.
            </div>
          )}

          <Button
            type="submit"
            loading={status === "loading"}
            disabled={status === "loading"}
            className="w-full justify-center"
          >
            Envoyer ma demande
          </Button>

          <p className="text-center text-sm text-[var(--slate-400)]">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-[var(--blue-400)] hover:text-[var(--blue-300)]">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </AuthPageTemplate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--slate-200)]">{label}</label>
      {children}
    </div>
  );
}

// Matches the login form's inputs exactly.
const inputCls =
  "w-full rounded-lg bg-[var(--slate-950)] px-4 py-2.5 text-sm text-[var(--slate-200)] placeholder-[var(--slate-500)] shadow-md shadow-black/50 focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)]";
