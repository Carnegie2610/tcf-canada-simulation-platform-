"use client";

import { useState } from "react";

interface SuperAdminSecurityModuleProps {
  userId: string;
  userEmail: string;
}

export function SuperAdminSecurityModule({ userId, userEmail }: SuperAdminSecurityModuleProps) {
  const [otpStatus, setOtpStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

  async function handleSendOtp() {
    setOtpStatus("loading");
    try {
      const res = await fetch(`/api/admin/users/${userId}/send-otp`, { method: "POST" });
      setOtpStatus(res.ok ? "sent" : "error");
    } catch {
      setOtpStatus("error");
    }
    setTimeout(() => setOtpStatus("idle"), 4000);
  }

  async function handleForcePassword() {
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setPwStatus("loading");
    try {
      const res = await fetch(`/api/admin/users/${userId}/force-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwError(json.error ?? "Erreur serveur");
        setPwStatus("error");
      } else {
        setPwStatus("done");
        setNewPassword("");
        setTimeout(() => setPwStatus("idle"), 3000);
      }
    } catch {
      setPwError("Erreur réseau");
      setPwStatus("error");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
        Module de sécurité — Super Admin
      </p>

      {/* OTP reset */}
      <div className="space-y-1.5">
        <p className="text-xs text-[var(--slate-400)]">
          Réinitialiser le mot de passe via e-mail&nbsp;:
          <span className="ml-1 text-[var(--slate-500)]">{userEmail}</span>
        </p>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={otpStatus === "loading"}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            otpStatus === "sent"
              ? "bg-emerald-500/10 text-emerald-400"
              : otpStatus === "error"
                ? "bg-red-500/10 text-red-400"
                : "border border-[var(--slate-600)] bg-[var(--slate-800)] text-[var(--slate-300)] hover:border-[var(--slate-500)] hover:text-[var(--brand-white)]"
          }`}
        >
          {otpStatus === "loading"
            ? "Envoi en cours..."
            : otpStatus === "sent"
              ? "✓ Code OTP envoyé"
              : otpStatus === "error"
                ? "Erreur d'envoi"
                : "✉ Envoyer un code de validation (OTP) par e-mail"}
        </button>
      </div>

      {/* Manual password override */}
      <div className="space-y-1.5">
        <p className="text-xs text-[var(--slate-400)]">Forcer un mot de passe temporaire&nbsp;:</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 caractères"
            className="w-full rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] px-3 py-1.5 text-sm text-[var(--brand-white)] placeholder:text-[var(--slate-500)] focus:border-[var(--blue-500)] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleForcePassword}
            disabled={pwStatus === "loading"}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              pwStatus === "done"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-[var(--blue-600)] text-white hover:bg-[var(--blue-500)]"
            }`}
          >
            {pwStatus === "loading"
              ? "..."
              : pwStatus === "done"
                ? "✓ Modifié"
                : "Modifier et forcer"}
          </button>
        </div>
        {pwError && (
          <p className="text-xs text-red-400">{pwError}</p>
        )}
      </div>
    </div>
  );
}
