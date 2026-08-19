/**
 * Content and display rules for the student-facing "Nouveautés" modal.
 *
 * To announce a future batch of features: replace WHATS_NEW_ITEMS and reset
 * profiles.whats_new_seen_count to 0 (`UPDATE public.profiles SET
 * whats_new_seen_count = 0;`), which re-runs the campaign for everyone.
 */

export interface WhatsNewItem {
  icon: string;
  title: string;
  description: string;
}

/**
 * How many separate logins the modal keeps appearing for before it stops for
 * good. Counted per session (see WhatsNewModal), not per page view, so browsing
 * around the dashboard never burns through the allowance.
 */
export const WHATS_NEW_MAX_VIEWS = 3;

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
 * True while this student still has views left on the current announcement.
 *
 * Callers pass profiles.whats_new_seen_count. On any doubt — a failed lookup, a
 * column that isn't there yet — pass WHATS_NEW_MAX_VIEWS so the modal stays
 * hidden: a missing announcement is harmless, a broken dashboard is not.
 */
export function shouldShowWhatsNew(seenCount: number): boolean {
  return seenCount < WHATS_NEW_MAX_VIEWS;
}
