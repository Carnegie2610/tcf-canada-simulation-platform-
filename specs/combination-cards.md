# High-Fidelity Student Portal & Combination Cards Blueprint

**Document Version:** 1.2.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada (Candidate Portal)

This blueprint outlines the visual specifications, interactive components, hover animations, and state configurations required to build a premium, highly intuitive student simulation portal. It focuses on transition to unified **Combinations** and provides clear visual hierarchies for our exam cards.

# 1. For every interface include a button to go to the previous page for seamless navigation accross the different pages

## 1. Live Expiration & Finish Visual Architecture

To eliminate ambiguity for candidates, the header must display a dual-layered subscription health indicator. It calculates both the countdown duration and the **exact calendar timestamp** of when access will terminate.

### A. Dynamic Header Segment UI

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  OBJECTIF 4C2   [ 🕒 Expire le mardi 21 juillet 2026 à 23:59 (42 j. restants) ]   [ 12/80 ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Mathematical Expiration Calculations

To calculate the remaining duration ($Days_{Remaining}$) and determine the exact date-time string on the client side:

1. **Days Countdown Formula:**

$$Days_{Remaining} = \max\left(0, \left\lceil \frac{T_{Expiry} - T_{Current}}{24 \times 60 \times 60 \times 1000} \right\rceil\right)$$

Where:

- $T_{Expiry}$ is the millisecond epoch timestamp of the user's subscription end date.
- $T_{Current}$ is the current local system timestamp.
1. **Exact End Date & Time Formatting (French Locale):**
    - Using Javascript’s `Intl.DateTimeFormat` engine, format the expiration date to show the day name, numeric day, month, year, and exact time of access closure:
        
        ```
        const formatFinishDateTime = (expirationDateString) => {
          const expiryDate = new Date(expirationDateString);
          const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          };
          return expiryDate.toLocaleDateString('fr-FR', options);
          // Output Example: "mardi 21 juillet 2026 à 23:59"
        };
        ```
        

## 2. Combination Card Visual Hierarchy Spec

When candidates access the simulation dashboard, each exam combination must be presented as a visually compelling card with a clear reading order.

```
┌─────────────────────────────────────────────────────────────────┐
│ 📝 EXPRESSION ÉCRITE                       [ ⚡ TCF CANADA ]    │ <-- 1. Type & Exam Badges
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Combinaison 1                                                  │ <-- 2. Bold Name &
│  Voyage extraordinaire & Cohabitation parentale                 │    Descriptive Titles
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 📋 3 Tâches Actives     ⏱️ 60 minutes          🔓 Prêt à lancer │ <-- 3. Metadata Row
├─────────────────────────────────────────────────────────────────┤
│ [ Commencer la simulation ]                                     │ <-- 4. Main CTA Button
└─────────────────────────────────────────────────────────────────┘
```

### Reading Order & Visual Breakdown

- **First Visual Anchor (Top-Row Badges):** * Left side displays the test category (`📝 Expression Écrite` or `🗣️ Expression Orale`) styled with bright, accessible colors.
    - Right side displays the target standard (`[ TCF Canada ]` or `[ TEF Canada ]`) using a premium high-contrast badge.
- **Primary Visual Focus (Middle-Row Bold Typography):**
    - The identifier **`Combinaison 1`** is set in an extra-bold, white font to capture immediate attention.
    - Below the identifier, the sub-topics of the combination are listed clearly (e.g., *"Voyage, Premier métro & Cohabitation"*) in a lighter slate grey, preventing cognitive overload while aiding rapid identification.
- **Secondary Visual Support (Metadata Block):**
    - Organized horizontally with generous spacing. It details core structural rules using icons: Number of tasks (`📋 3 Tâches`), global time duration (`⏱️ 60 Minutes`), and active submission state (`🔓 Prêt` or `🔒 Soumis`).
- **Final Visual Anchor (Primary Action Call-to-Action):**
    - A full-width, highly-visible button at the bottom of the card clearly indicating the next operational step.

## 3. Premium Interactive Hover Tokens (Tailwind CSS)

To make the simulation portal feel responsive and high-fidelity, apply this custom sequence of design tokens to your card component:

### A. The Hover Sequence Engine

- **Base State Configuration:**`bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 ease-out transform translate-y-0`
- **Active Hover Actions:**`hover:-translate-y-2 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]`

### B. Element-Specific Interactive Transitions

- **The Main Call-to-Action Button:**
Apply a gradient background (`bg-gradient-to-r from-blue-600 to-indigo-600`) that increases in brightness and expands slightly when the parent card is hovered over.
    - Tailwind configuration: `group-hover:scale-[1.02] group-hover:brightness-110 active:scale-95 transition-all duration-300`
- **Status Badge Pulsing Glow:**
If a combination is ready (`🔓 Prêt`), add an active green pulsing border dot to show it is live and waiting:
    - CSS Animation: `animate-pulse` on a green ping marker (`bg-emerald-400`).

## 4. Frontend Component Code Blueprint (React & Tailwind)

Here is how to render the dynamic Combination Card array inside your student application:

```
import React from "react";

export default function CombinationCard({ combination, onStart, currentUsage, maxQuota }) {
  const { id, title, examType, type, tasksCount, duration, status } = combination;

  const isLocked = status === "submitted" || currentUsage >= maxQuota;

  return (
    <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 ease-out transform hover:-translate-y-2 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]">

      {/* 1. Header Badges */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <span className="text-sm">📝</span> {type}
        </span>
        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
          ⚡ {examType}
        </span>
      </div>

      {/* 2. Bold Name & Theme */}
      <div className="mb-6">
        <h3 className="text-xl font-extrabold text-slate-100 group-hover:text-white transition-colors duration-200">
          Combinaison {id}
        </h3>
        <p className="text-sm text-slate-400 group-hover:text-slate-300 mt-1.5 line-clamp-1 transition-colors duration-200">
          {title}
        </p>
      </div>

      {/* 3. Metadata Horizontal Divider Row */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-4 text-xs text-slate-300">
        <span className="flex items-center gap-1.5 font-medium">
          <span>📋</span> {tasksCount} Tâches
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span>⏱️</span> {duration} Min.
        </span>

        {/* Dynamic Status Tag */}
        {isLocked ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            🔒 Soumis
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Prêt
          </span>
        )}
      </div>

      {/* 4. Interactive Main Action Button */}
      <div className="mt-5">
        <button
          onClick={() => !isLocked && onStart(id)}
          disabled={isLocked}
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
            isLocked
              ? "bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-blue-900/20"
          }`}
        >
          {isLocked ? "Simulation Soumise" : "Commencer la simulation"}
        </button>
      </div>
    </div>
  );
}
```

## 5. Security & Data Integrity Verification

Whenever a candidate clicks the active action button to launch an exam, the system must perform a single-read Firestore guardrail check to prevent unauthorized combination access.

### Client-Side Action Dispatcher

```
const handleLaunchClick = (combinationId, userProfile) => {
  const now = new Date();
  const isExpired = new Date(userProfile.expiration_date) <= now;
  const isQuotaExceeded = userProfile.plan.current_simulations_used >= userProfile.plan.max_simulations_quota;

  if (isExpired) {
    showModal("Abonnement Expiré", "Votre période d'accès s'est terminée le " + formatFinishDateTime(userProfile.expiration_date) + ". Veuillez contacter un administrateur.");
    return;
  }

  if (isQuotaExceeded) {
    showModal("Quota Atteint", `Vous avez effectué ${userProfile.plan.current_simulations_used} sur ${userProfile.plan.max_simulations_quota} simulations prévues dans votre formule.`);
    return;
  }

  // If all validation guardrails pass, launch the active exam screen
  initializeSimulationArena(combinationId);
};
```

This verification logic guarantees that candidates are strictly guided by their active quotas and accurate subscription boundaries.