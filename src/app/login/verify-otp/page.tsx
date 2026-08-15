"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPageTemplate } from "@/components/templates/AuthPageTemplate";
import { Button } from "@/components/atoms/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Must match the live Supabase project's Auth > Email OTP length setting — this
// project sends 8-digit codes (confirmed from real received emails), not the
// 6-digit default.
const CODE_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 30;

function OtpBoxes({
  digits,
  onChange,
  disabled,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    onChange(next);
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? "");
    onChange(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex gap-1.5 sm:gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`aspect-square w-full min-w-0 flex-1 rounded-lg border border-gray-300 text-center text-lg font-semibold text-slate-950 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--blue-500] disabled:opacity-50 sm:text-2xl ${
            digit ? "bg-gray-300" : "bg-white"
          }`}
        />
      ))}
    </div>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  if (!email) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[--slate-300]">
          Aucune adresse e-mail à vérifier. Veuillez recommencer la connexion.
        </p>
        <Button href="/login" className="w-full justify-center">
          Retour à la connexion
        </Button>
      </div>
    );
  }

  const code = digits.join("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email!,
        token: code,
        type: "email",
      });

      if (verifyError) {
        setError("Code invalide ou expiré. Veuillez réessayer.");
        return;
      }

      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendLoading) return;
    setError(null);
    setResendMessage(null);
    setResendLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: email!,
        options: { shouldCreateUser: false },
      });

      if (resendError) {
        setError("Échec de l'envoi du code. Réessayez dans un instant.");
        return;
      }

      setDigits(Array(CODE_LENGTH).fill(""));
      setResendMessage("Un nouveau code vous a été envoyé.");
      startCooldown();
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[--blue-800] bg-[--slate-950]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-[--blue-400]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9.5 12l1.8 1.8L15 10" />
          </svg>
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold tracking-wide text-[--blue-300] sm:text-3xl">
          VERIFICATION OTP
        </h2>
        <p className="mt-8 text-base text-[--slate-400]">
          Un code à {CODE_LENGTH} chiffres a été envoyé à
          <br />
          <span className="font-semibold text-[--slate-200]">{email}</span>.
          <br />
          Entrez-le ci-dessous pour continuer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-center text-base font-medium text-[--slate-200]">
            Code de vérification
          </label>
          <OtpBoxes digits={digits} onChange={setDigits} disabled={loading} />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {resendMessage && !error && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {resendMessage}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={loading || code.length !== CODE_LENGTH}
          className="w-full justify-center gap-2 bg-[--blue-600] hover:bg-[--blue-500] shadow-blue-900/30"
        >
          Vérifier <span aria-hidden="true">→</span>
        </Button>
      </form>

      <div className="text-center text-lg">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="font-medium disabled:cursor-not-allowed"
        >
          {resendLoading ? (
            <span className="text-[--slate-500]">Envoi en cours...</span>
          ) : resendCooldown > 0 ? (
            <span className="text-[--slate-500]">{`Renvoyer le code (${resendCooldown}s)`}</span>
          ) : (
            <>
              <span className="block text-[--slate-400]">Vous n&apos;avez rien reçu ?</span>
              <span className="mt-1 block text-[--blue-400] underline underline-offset-2 hover:text-[--blue-300] transition-colors">
                Renvoyer le code
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthPageTemplate wide showHeading={false} backHref="/login">
      <Suspense fallback={null}>
        <VerifyOtpForm />
      </Suspense>
    </AuthPageTemplate>
  );
}
