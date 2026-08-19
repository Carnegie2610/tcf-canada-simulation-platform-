/**
 * Content and release marker for the student-facing "Nouveautés" modal.
 *
 * To announce a future batch of features: replace WHATS_NEW_ITEMS and bump
 * WHATS_NEW_RELEASED_AT. Every student whose profiles.whats_new_seen_at is older
 * than that date (or NULL) will be shown the modal once more.
 */

export interface WhatsNewItem {
  icon: string;
  title: string;
  description: string;
}

/** Bump this when publishing a new announcement. ISO 8601, UTC. */
export const WHATS_NEW_RELEASED_AT = "2026-08-19T00:00:00.000Z";

export const WHATS_NEW_TITLE = "Quoi de neuf sur Objectif 4C2";

export const WHATS_NEW_INTRO =
  "Votre espace a évolué. Voici les nouveautés désormais disponibles dans votre préparation.";

export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  {
    icon: "🎙️",
    title: "Simulations d'Expression Orale",
    description:
      "Enregistrez vos réponses aux 3 tâches et recevez une correction détaillée par IA, avec transcription et notation par tâche.",
  },
  {
    icon: "📁",
    title: "Solution modèle en Expression Orale",
    description:
      "Sur chaque correction orale, consultez la réponse modèle de niveau C2 pour comparer avec votre production.",
  },
  {
    icon: "📊",
    title: "Quotas séparés Écrit / Oral",
    description:
      "Vos simulations d'expression écrite et orale disposent maintenant de compteurs indépendants, affichés séparément en haut de votre espace.",
  },
  {
    icon: "🗂️",
    title: "Historique filtrable par épreuve",
    description:
      "Dans Historique & Progrès, filtrez vos simulations terminées par Expression Écrite ou Expression Orale, et suivez votre trajectoire CECR.",
  },
  {
    icon: "💬",
    title: "Support avec suivi de vos tickets",
    description:
      "Choisissez un sujet, envoyez votre message, et suivez la réponse de l'équipe directement depuis « Mes tickets ».",
  },
  {
    icon: "🌗",
    title: "Mode clair et mode sombre",
    description:
      "Basculez entre les deux thèmes à tout moment grâce à l'icône en haut de votre espace.",
  },
];

/**
 * True when this student has not yet acknowledged the current announcement.
 * `seenAt` is profiles.whats_new_seen_at (NULL for students who have never
 * dismissed one, including newly created accounts).
 */
export function shouldShowWhatsNew(seenAt: string | null): boolean {
  if (!seenAt) return true;
  return new Date(seenAt).getTime() < new Date(WHATS_NEW_RELEASED_AT).getTime();
}
