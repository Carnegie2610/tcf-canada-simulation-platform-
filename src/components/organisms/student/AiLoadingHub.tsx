"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AiLoadingHubProps {
  submissionId: string;
  onError: () => void;
}

const STATUS_MESSAGES = [
  "🧠 Vérification des quotas de simulation et initialisation de l'analyseur...",
  "📝 Lecture et compilation des copies de Tâche 1, 2 et 3...",
  "🔍 Démarrage du diagnostic orthographique et de la détection d'erreurs...",
  "📊 Évaluation des critères CEFR (Compréhension, Méthodologie et Cohérence)...",
  "✍️ Rédaction de votre version C1/C2 personnalisée...",
  "💾 Enregistrement sécurisé de votre diagnostic dans l'historique...",
];

const PARTICLES = Array.from({ length: 12 }, (_, i) => i);

export function AiLoadingHub({ submissionId, onError }: AiLoadingHubProps) {
  const router = useRouter();
  const [statusIndex, setStatusIndex] = useState(0);
  const [fadeText, setFadeText] = useState(true);
  const [success, setSuccess] = useState(false);
  const [fading, setFading] = useState(false);
  const apiCalledRef = useRef(false);

  // Cycle through status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeText(false);
      setTimeout(() => {
        setStatusIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
        setFadeText(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Fire API call once on mount
  useEffect(() => {
    if (apiCalledRef.current) return;
    apiCalledRef.current = true;

    fetch(`/api/student/combination-submissions/${submissionId}/evaluate`, {
      method: "POST",
    })
      .then(async (res) => {
        const data = await res.json() as { ok?: boolean; evaluationId?: string; error?: string };
        if (!res.ok || !data.ok) {
          onError();
          return;
        }
        // Success: flash green then fade out
        setSuccess(true);
        setTimeout(() => {
          setFading(true);
          setTimeout(() => {
            router.push(`/dashboard/history/combination/${submissionId}`);
          }, 400);
        }, 600);
      })
      .catch(() => onError());
  }, [submissionId, onError, router]);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Orbital ring cluster */}
      <div className="relative mb-10 flex items-center justify-center">
        <svg
          width="200"
          height="200"
          viewBox="-100 -100 200 200"
          className="absolute"
          style={{ animation: "spin 8s linear infinite" }}
        >
          <ellipse cx="0" cy="0" rx="90" ry="30" fill="none" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.4" />
        </svg>
        <svg
          width="200"
          height="200"
          viewBox="-100 -100 200 200"
          className="absolute"
          style={{ animation: "spin 5s linear infinite reverse" }}
        >
          <ellipse cx="0" cy="0" rx="70" ry="50" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.35" transform="rotate(60)" />
        </svg>
        <svg
          width="200"
          height="200"
          viewBox="-100 -100 200 200"
          className="absolute"
          style={{ animation: "spin 3s linear infinite" }}
        >
          <ellipse cx="0" cy="0" rx="50" ry="20" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" transform="rotate(-40)" />
        </svg>

        {/* Floating particles */}
        {PARTICLES.map((i) => {
          const angle = (i / PARTICLES.length) * 360;
          const radius = 55 + (i % 3) * 15;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const delay = (i * 0.2).toFixed(1);
          return (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: i % 2 === 0 ? "#f59e0b" : "#06b6d4",
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
                animation: `particleDrift 3s ease-in-out infinite alternate`,
                animationDelay: `${delay}s`,
                opacity: 0.6,
              }}
            />
          );
        })}

        {/* Center star */}
        <div
          className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-all duration-500 ${
            success
              ? "shadow-[0_0_50px_rgba(34,197,94,0.8)] bg-emerald-900/40"
              : "shadow-[0_0_50px_rgba(34,197,94,0.3)] bg-slate-900/60 animate-pulse"
          }`}
        >
          {success ? "✅" : "✦"}
        </div>
      </div>

      {/* Status text */}
      <p
        className={`max-w-sm text-center text-sm font-medium text-slate-300 transition-opacity duration-300 ${
          fadeText ? "opacity-100" : "opacity-0"
        }`}
      >
        {STATUS_MESSAGES[statusIndex]}
      </p>

      {/* Progress dots */}
      <div className="mt-6 flex gap-1.5">
        {STATUS_MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              i <= statusIndex ? "bg-blue-500" : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes particleDrift {
          from { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          to { transform: translate(-50%, -50%) scale(1.8); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
