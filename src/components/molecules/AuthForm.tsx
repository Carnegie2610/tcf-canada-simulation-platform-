"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";

interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function AuthForm({ onSubmit, loading, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(email, password);
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
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[--slate-700] bg-[--slate-950] px-4 py-2.5 text-sm text-white placeholder-[--slate-500] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--blue-500]"
          placeholder="••••••••"
        />
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
