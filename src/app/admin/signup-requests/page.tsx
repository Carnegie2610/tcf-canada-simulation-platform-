"use client";

import { useEffect, useState } from "react";
import { UserForm } from "@/components/molecules/admin/UserForm";
import { getPlanMeta } from "@/lib/plans";

interface SignupRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  desired_plan_ee: string | null;
  desired_plan_eo: string | null;
}

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTER_LABEL: Record<Filter, string> = {
  pending: "En attente",
  approved: "Approuvées",
  rejected: "Refusées",
  all: "Toutes",
};

/** Strips spaces and punctuation so wa.me accepts the number. */
function whatsappHref(phone: string, name: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(
    `Bonjour ${name}, nous avons bien reçu votre demande d'inscription sur Objectif 4C2. Pouvons-nous en discuter ?`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

const STATUS_STYLE: Record<SignupRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_LABEL: Record<SignupRequest["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

export default function SignupRequestsPage() {
  const [items, setItems] = useState<SignupRequest[] | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  // The request being approved — opens the standard create-user form prefilled,
  // so packs, quota and the payment record all go through the existing flow
  // rather than a parallel one that could drift from it.
  const [approving, setApproving] = useState<SignupRequest | null>(null);

  async function load() {
    const res = await fetch("/api/admin/signup-requests");
    const json = (await res.json()) as { data?: SignupRequest[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    await fetch(`/api/admin/signup-requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function handleReject(r: SignupRequest) {
    if (!window.confirm(`Refuser la demande de ${r.full_name} ?`)) return;
    await setStatus(r.id, "rejected");
  }

  const visible = (items ?? []).filter((r) => filter === "all" || r.status === filter);
  const pendingCount = (items ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)]">
            Demandes d&apos;inscription
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2.5 py-0.5 align-middle text-sm font-bold text-white">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-[var(--slate-400)]">
            Approuvez une demande pour créer le compte de l&apos;étudiant et lui
            attribuer ses forfaits.
          </p>
        </div>

        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => {
            const count =
              f === "all"
                ? (items ?? []).length
                : (items ?? []).filter((r) => r.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "border-blue-500 bg-blue-600/20 text-blue-300"
                    : "border-[var(--slate-700)] text-[var(--slate-400)] hover:bg-[var(--slate-800)]"
                }`}
              >
                {FILTER_LABEL[f]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items === null ? (
          <p className="text-sm text-[var(--slate-500)]">Chargement...</p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-10 text-center text-sm text-[var(--slate-500)]">
            Aucune demande dans « {FILTER_LABEL[filter]} ».
          </div>
        ) : (
          visible.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]"
            >
              {/* Header: who, and what you can do about it */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--slate-800)] bg-[var(--slate-800)]/30 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--slate-700)] text-sm font-bold text-[var(--slate-200)]">
                    {r.full_name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--brand-white)]">
                      {r.full_name}
                    </p>
                    <p className="text-[11px] text-[var(--slate-500)]">
                      Reçue le {new Date(r.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {r.phone && (
                    <a
                      href={whatsappHref(r.phone, r.full_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-emerald-500/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => setApproving(r)}
                        className="rounded-lg bg-[var(--blue-600)] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--blue-500)]"
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => void handleReject(r)}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Body: labelled fields rather than a flat stack of values */}
              <div className="px-5 py-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Detail label="Adresse e-mail">
                    <a href={`mailto:${r.email}`} className="text-[var(--accent-blue-text)] hover:underline">
                      {r.email}
                    </a>
                  </Detail>

                  <Detail label="Téléphone">
                    {r.phone ? (
                      <span className="text-[var(--slate-200)]">{r.phone}</span>
                    ) : (
                      <span className="text-[var(--slate-500)]">Non renseigné</span>
                    )}
                  </Detail>

                  <div className="sm:col-span-2">
                    <Detail label="Formules souhaitées">
                      {r.desired_plan_ee || r.desired_plan_eo ? (
                        <span className="flex flex-wrap gap-1.5">
                          {r.desired_plan_ee && (
                            <span className="rounded-md border border-blue-500/40 bg-blue-600/10 px-2 py-0.5 text-[11px] text-[var(--accent-blue-text)]">
                              EE · {getPlanMeta(r.desired_plan_ee).label}
                            </span>
                          )}
                          {r.desired_plan_eo && (
                            <span className="rounded-md border border-emerald-500/40 bg-emerald-600/10 px-2 py-0.5 text-[11px] text-emerald-400">
                              EO · {getPlanMeta(r.desired_plan_eo).label}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[var(--slate-500)]">Aucune préférence indiquée</span>
                      )}
                    </Detail>
                  </div>
                </dl>

                {r.message && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                      Son objectif
                    </p>
                    <p className="whitespace-pre-wrap rounded-lg border-l-2 border-[var(--slate-600)] bg-[var(--slate-800)]/40 px-4 py-3 text-sm leading-relaxed text-[var(--slate-300)]">
                      {r.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {approving && (
        <UserForm
          mode="create"
          prefill={{
            full_name: approving.full_name,
            email: approving.email,
            assigned_plan_ee: approving.desired_plan_ee,
            assigned_plan_eo: approving.desired_plan_eo,
          }}
          onSuccess={() => {
            // The account exists now — close the loop on the request so it leaves
            // the queue. Done after creation, never before.
            void setStatus(approving.id, "approved");
            setApproving(null);
          }}
          onCancel={() => setApproving(null)}
        />
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-[var(--slate-500)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
