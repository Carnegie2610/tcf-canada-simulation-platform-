"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";

interface AiCorrectionTriggerProps {
  submissionId: string;
}

export function AiCorrectionTrigger({ submissionId }: AiCorrectionTriggerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRequest() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `/api/student/submissions/${submissionId}/evaluate`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        if (data.error === "ai_corrections_disabled") {
          setErrorMsg("Les corrections IA ne sont pas activées sur votre compte. Contactez le support.");
        } else if (data.error === "ai_not_configured") {
          setErrorMsg("Le service IA est temporairement indisponible.");
        } else {
          setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
        }
        setStatus("error");
        return;
      }

      // Refresh page to show results
      router.refresh();
    } catch {
      setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--blue-500)]/30 bg-[var(--blue-600)]/5 px-6 py-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--brand-white)]">
          Correction par l&apos;IA disponible
        </h3>
        <p className="mt-1 text-xs text-[var(--slate-400)]">
          Obtenez une analyse détaillée de votre texte : corrections grammaticales, lexicales
          et syntaxiques, ainsi qu&apos;un modèle de réponse niveau C2.
        </p>
      </div>

      {errorMsg && (
        <p className="text-xs text-[var(--brand-red)]">{errorMsg}</p>
      )}

      <Button
        onClick={handleRequest}
        loading={status === "loading"}
        disabled={status === "loading"}
        size="sm"
      >
        {status === "loading"
          ? "Analyse en cours… (peut prendre jusqu'à 45 s)"
          : "Demander une correction par l'IA"}
      </Button>
    </div>
  );
}
