import { AiCorrectionTrigger } from "@/components/molecules/student/AiCorrectionTrigger";
import { LibraryCanvas } from "@/components/organisms/student/LibraryCanvas";
import { cefrColorClass } from "@/lib/admin/cefr";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";

interface SubmissionDetailViewProps {
  submission: SubmissionWithEvaluation;
}

export function SubmissionDetailView({ submission }: SubmissionDetailViewProps) {
  const { evaluation } = submission;

  const date = new Date(submission.created_at).toLocaleDateString("fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--brand-white)]">
          {submission.exam.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-500)]">
          {submission.exam.exam_type} · {submission.exam.section.replace("_", " ")} · {date}
        </p>
      </div>

      {/* Evaluated state */}
      {evaluation ? (
        <>
          {/* Score summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreCard label="Niveau CECR" value={evaluation.cefr_level} colorClass={cefrColorClass(evaluation.cefr_level)} />
            <ScoreCard label="Score global" value={`${evaluation.global_score}/100`} />
            <ScoreCard label="Grammaire" value={`${evaluation.grammar_score}/20`} />
            <ScoreCard label="Cohérence" value={`${evaluation.coherence_score}/20`} />
          </div>

          {/* Side by side: user draft | corrections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                Votre texte
              </h2>
              <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 text-sm text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
                {submission.user_draft}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
                Corrections de l&apos;IA
              </h2>
              <div className="space-y-3">
                {evaluation.json_feedback.corrections.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex rounded bg-[var(--brand-red)]/20 px-2 py-0.5 text-xs font-medium text-[var(--brand-red)]">
                        {c.errorType}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--slate-500)] line-through mb-1">
                      {c.originalSegment}
                    </p>
                    <p className="text-sm font-medium text-green-400 mb-2">
                      {c.correctedSegment}
                    </p>
                    <p className="text-xs text-[var(--slate-400)] italic">
                      {c.explanationFr}
                    </p>
                  </div>
                ))}
                {evaluation.json_feedback.corrections.length === 0 && (
                  <p className="text-sm text-green-400">Aucune correction nécessaire — excellent travail !</p>
                )}
              </div>
            </section>
          </div>

          {/* C2 Model answer — copy-protected */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
              Modèle corrigé (niveau C2)
            </h2>
            <LibraryCanvas>
              <div className="rounded-xl border border-[var(--blue-500)]/30 bg-[var(--blue-600)]/5 p-5 text-sm text-[var(--slate-200)] leading-relaxed whitespace-pre-wrap">
                {evaluation.model_answer_c2}
              </div>
            </LibraryCanvas>
          </section>
        </>
      ) : (
        <>
          {/* Raw draft (no evaluation yet) */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
              Votre texte soumis
            </h2>
            <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 text-sm text-[var(--slate-300)] leading-relaxed whitespace-pre-wrap">
              {submission.user_draft || <span className="italic text-[var(--slate-600)]">Texte vide</span>}
            </div>
          </section>

          {/* AI trigger */}
          {submission.is_completed && (
            <AiCorrectionTrigger submissionId={submission.id} />
          )}

          {!submission.is_completed && (
            <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 px-5 py-4 text-sm text-yellow-400">
              Cette simulation est encore en cours. Soumettez-la pour obtenir une correction IA.
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ScoreCardProps {
  label: string;
  value: string;
  colorClass?: string;
}

function ScoreCard({ label, value, colorClass }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-4 py-3">
      <p className="text-xs text-[var(--slate-500)]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${colorClass ?? "text-[var(--brand-white)]"}`}>
        {value}
      </p>
    </div>
  );
}
