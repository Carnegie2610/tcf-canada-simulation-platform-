"use client";

interface SubmissionGateProps {
  onDashboard: () => void;
  onEvaluate: () => void;
}

export function SubmissionGate({ onDashboard, onEvaluate }: SubmissionGateProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--slate-950)]/92 backdrop-blur-sm">
      <div className="mx-6 w-full max-w-xl rounded-2xl border border-[var(--slate-700)]/60 bg-[var(--slate-900)] p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-2xl">✅</span>
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-[var(--slate-200)]">
            Évaluations conservées !
          </h2>
        </div>
        <p className="mb-8 text-center text-sm text-[var(--slate-400)]">
          Vos productions écrites ont été enregistrées en tant que brouillon.
          Veuillez choisir l&apos;action suivante&nbsp;:
        </p>

        {/* Two options */}
        <div className="grid grid-cols-2 gap-4">
          {/* Option A: Return to dashboard */}
          <button
            onClick={onDashboard}
            className="flex flex-col items-center gap-2 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-800)]/60 p-5 text-center transition-all hover:border-[var(--slate-700)] hover:bg-[var(--slate-800)]"
          >
            <span className="text-3xl">🏠</span>
            <span className="text-sm font-semibold text-[var(--slate-200)]">
              Retourner au Tableau de bord
            </span>
            <span className="text-xs text-[var(--slate-500)]">Sauvegarde sans correction</span>
          </button>

          {/* Option B: AI correction */}
          <button
            onClick={onEvaluate}
            className="flex flex-col items-center gap-2 rounded-xl border border-blue-600/40 bg-gradient-to-b from-blue-950/60 to-[var(--slate-900)] p-5 text-center transition-all hover:border-blue-500/60 hover:from-blue-950/80"
          >
            <span className="text-3xl">🧠</span>
            <span className="text-sm font-semibold text-blue-300">
              Obtenir ma Correction IA
            </span>
            <span className="text-xs text-blue-300/70">Analyse instantanée</span>
          </button>
        </div>

        {/* Credit warning */}
        <p className="mt-6 text-center text-xs text-[var(--accent-amber-text)]/80">
          ⚠️ Note&nbsp;: Demander une correction automatique consommera 1 crédit.
        </p>
      </div>
    </div>
  );
}
