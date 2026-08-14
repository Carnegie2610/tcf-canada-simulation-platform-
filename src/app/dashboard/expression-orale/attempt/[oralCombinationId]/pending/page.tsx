"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AiLoadingHub } from "@/components/organisms/student/AiLoadingHub";

interface OralPendingPageProps {
  searchParams: Promise<{ sid?: string }>;
}

export default function OralPendingPage({ searchParams }: OralPendingPageProps) {
  const router = useRouter();
  const { sid } = use(searchParams);
  const [aiError, setAiError] = useState(false);

  if (!sid) {
    router.push("/dashboard/expression-orale");
    return null;
  }

  if (aiError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-300">
          Une erreur est survenue pendant l&apos;évaluation de votre simulation orale.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      <AiLoadingHub
        submissionId={sid}
        evaluateEndpoint={`/api/student/oral-submissions/${sid}/evaluate`}
        redirectTo={`/dashboard/expression-orale/result/${sid}`}
        onError={() => setAiError(true)}
      />
    </div>
  );
}
