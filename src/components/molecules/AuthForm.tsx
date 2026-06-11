"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";

interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onForgotPassword?: (email: string) => Promise<string | null>;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function AuthForm({ onSubmit, loading, error, onForgotPassword }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(email, password);
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onForgotPassword) return;
    setForgotLoading(true);
    setForgotError(null);
    const err = await onForgotPassword(forgotEmail);
    setForgotLoading(false);
    if (err) {
      setForgotError(err);
      setForgotStatus("error");
    } else {
      setForgotStatus("sent");
    }
  }

  if (forgotMode) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[--slate-100]">Réinitialiser le mot de passe</h2>
          <p className="mt-1 text-sm text-[--slate-400]">
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {forgotStatus === "sent" ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm text-green-400">
            Un lien de réinitialisation vous a été envoyé ! Vérifiez votre boîte de réception.
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[--slate-200]">Adresse e-mail</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full rounded-lg border border-[--slate-700] bg-[--slate-950] px-4 py-2.5 text-sm text-white placeholder-[--slate-500] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--blue-500]"
                placeholder="votre@email.com"
              />
            </div>
            {forgotError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {forgotError}
              </div>
            )}
            <Button type="submit" loading={forgotLoading} disabled={forgotLoading} className="w-full justify-center">
              Envoyer le lien
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => { setForgotMode(false); setForgotStatus("idle"); setForgotError(null); }}
          className="text-xs text-[--slate-500] hover:text-[--slate-300] transition-colors"
        >
          ← Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-[--slate-200]">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[--slate-700] bg-[--slate-950] px-4 py-2.5 text-sm text-white placeholder-[--slate-500] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--blue-500]"
          placeholder="votre@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-[--slate-200]">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[--slate-700] bg-[--slate-950] px-4 py-2.5 pr-10 text-sm text-white placeholder-[--slate-500] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--blue-500]"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-[--slate-500] hover:text-[--slate-300] transition-colors"
            tabIndex={-1}
            aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
        {onForgotPassword && (
          <button
            type="button"
            onClick={() => { setForgotMode(true); setForgotEmail(email); }}
            className="mt-1 text-xs text-[--slate-500] hover:text-[--blue-400] transition-colors"
          >
            Mot de passe oublié ?
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={loading}
        className="w-full justify-center bg-[--blue-600] hover:bg-[--blue-500] shadow-blue-900/30"
      >
        Se connecter
      </Button>
    </form>
  );
}
