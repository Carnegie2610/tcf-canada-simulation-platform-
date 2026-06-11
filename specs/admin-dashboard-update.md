# Technical Specification: Main Dashboard Temporal Filters & Dedicated Student Auditor Page

**Document Version:** 1.9.1

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada (Administrative Portal)

This document outlines the visual specifications, layout architectures, and real-time database synchronization rules for the main overview dashboard, the dedicated Student Auditor Profile Page, the Admin Questions Catalog, the Student History Export Interface, and the User Directory Page. It provides complete design parameters to integrate rich, interactive progress charts, consistency trackers, live deletion listeners, secure candidate downloads, and role-restricted credentials management directly into the system.

## 1. Page Locations & Structural Separation of Concerns

To preserve a clean user experience, the administrative and student portals separate high-level system metrics, user profile lists, curriculum editing, student auditing, and candidate history into distinct workspaces:

- **Target Page A: The Main Administrative Dashboard ("Tableau de bord"):**
    - **Location:** The root administrative route `/admin/dashboard` (accessed by clicking **"Tableau de bord"** in the sidebar).
    - **Role:** Acts strictly as the global, high-level analytics control center. It represents platform-wide activity, cumulative completion metrics, system health, and general cohort progress.
- **Target Page B: The Dedicated Student Auditor Profile Page:**
    - **Location:** The specific route `/admin/audit/:studentId` (triggered instantly when clicking the `[🔍 Auditer]` button in the dashboard table or user directory).
    - **Role:** A deep-dive, single-candidate auditing workspace. It displays their active billing plans, expiration dates, quotas, and complete historical submissions with CEFR trajectory line graphs and task performance charts.
- **Target Page C: Admin Questions & Combinations Catalog Page:**
    - **Location:** The specific route `/admin/questions` or `/admin/combinations` (accessed by clicking **"Questions"** or **"Sujets"** in the sidebar).
    - **Role:** The primary curriculum manager where administrators add, edit, or delete combination subjects. It relies on live-updating deletion state listeners to ensure absolute visual synchronization.
- **Target Page D: Student Exam History & Entry Download Page:**
    - **Location:** The specific candidate-facing route `/student/history` or `/student/history/:submissionId` (accessed by clicking **"Historique"** in the student sidebar).
    - **Role:** Allows students to review their past exam attempts, read AI evaluations, and securely download their personal submissions.
- **Target Page E: User Directory & Management Page ("Utilisateurs"):**
    - **Location:** The specific route `/admin/users` (accessed by clicking **"Utilisateurs"** in the sidebar).
    - **Role:** Lists all platform users (maximum 30 per page) with status tags. It houses the secure **User Information Detail Modal** where student account parameters and credentials can be modified.

## 2. Page A: Main Administrative Dashboard Visual Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Tableau de bord                                                                       │
│  Vue d'ensemble de la plateforme                                                       │
│                                                                                        │
│  Filtrer par période: [ Aujourd'hui ]  [ Hier ]  [ Avant-hier ]  [ Tout ]             │ <-- Global Filter Bar
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  COHORT OVERVIEW STATE                                                                 │
│  ┌────────────────────────┐ ┌────────────────────────┐ ┌─────────────────────────────┐ │
│  │ 👤 ÉTUDIANTS INSCRITS  │ │ 📝 SOUMISSIONS D'ESSAIS│ │ 📁 COMBINAISONS CRÉÉES      │ │
│  │ 2                      │ │ 14                     │ │ 3                           │ │
│  │ [ +100% vs hier ]      │ │ [ -12% vs hier ]       │ │ [ Nouveau ]                 │ │
│  └────────────────────────┘ └────────────────────────┘ └─────────────────────────────┘ │
│                                                                                        │
│  DATA ANALYTICS GRAPHS (Adapts to display active Cohort trends)                        │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│  │ VOLUME DE SOUMISSIONS (PÉRIODE ACTIVE)  │ │ DISTRIBUTION DES NIVEAUX CECRL (PIE) │ │
│  │ (Bar Chart)                            │ │ (Donut Chart)                        │ │
│  └────────────────────────────────────────┘ └──────────────────────────────────────┘ │
│                                                                                        │
│  UNIFIED ACTIVITY FEED (Paginates filtered items - Max 20 rows per view)               │
│  ┌───────────┬──────────────────────┬───────────────────┬────────────────┬──────────┬────────────┬──────────────┐ │
│  │ Étudiant  │ Formule / Plan       │ Quota Restant     │ Sujet / Examen │ Créé le  │ Expiration │ Action       │ │
│  ├───────────┼──────────────────────┼───────────────────┼────────────────┼──────────┼────────────┼──────────────┤ │
│  │ duplex    │ Premium (10 000 CFA) │ 68 / 80 restants  │ Combinaison 1  │ 14:15    │ 30/06/2026 │ [🔍 Auditer] │ │
│  │ Beatrice  │ Base (5 000 CFA)     │ 28 / 40 restants  │ Combinaison 3  │ Hier     │ 15/07/2026 │ [🔍 Auditer] │ │
│  └───────────┴──────────────────────┴───────────────────┴────────────────┴──────────┴────────────┴──────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Page B: Updated Dedicated Student Auditor Page (`/admin/audit/:studentId`)

When redirected to the specific student path, the interface transitions from global data to an individual candidate dossier. The layout features the following structural components:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ◀ Retour au Tableau de bord                                                           │ <-- Return Navigation Button
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PROFIL ÉTUDIANT: Jean Dupont (jean.dupont@email.com)                                  │
│  Statut Compte: [ 🟢 Actif ]   Plan de tarification: Plan Premium (10 000 CFA)         │ <-- 1. Profile Metadata Bar
│  Expiration: Mardi 21 juillet 2026 à 23:59 (42 jours restants)                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Component 3: Live Quota Progress Bar                                                  │
│  Progrès Quota: [██████░░░░] 12 / 80 simulations complétées (68 restants)               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Component 4: Student Consistency Heatmap                                              │
│  Série de travail en cours : 🔥 5 jours d'affilée  |  Total de combinaisons : 12 / 80  │
│  [█] [█] [ ] [█] [█] [█] [█] (Assiduité hebdomadaire - Contribution Grid)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  SECTION VISUELLE : ANALYTIQUES INDIVIDUELS                                           │
│                                                                                        │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│  │ TRAJECTOIRE GLOBAL DU NIVEAU CECRL     │ │ PERFORMANCE MOYENNE PAR TÂCHE (BAR)  │ │ <-- 5. Analytics Panel
│  │ (Line Chart: Score progression)        │ │                                      │ │
│  │                                        │ │   Tâche 1 (Email) : █ █ █ [B2]       │ │
│  │  C2 ┼────────────────────────────────  │ │   Tâche 2 (Blog)  : █ █ █ █ █ [C1]   │ │
│  │  C1 ┼───────────────●────────────────  │ │   Tâche 3 (Arg.)  : █ █ █ █ [B2+]    │ │
│  │  B2 ┼────────●──────┼────────────────  │ │                                      │ │
│  │  B1 ┼──●─────┼──────┼────────────────  │ │   Distribution des notes (Pie):      │ │
│  │  A2 ┼──┼─────┼──────┼────────────────  │ │   ● C1: 40%  ● B2: 45%  ● B1: 15%      │ │
│  │     Comb.1 Comb.2 Comb.3               │ │                                      │ │
│  └────────────────────────────────────────┘ └──────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  HISTORIQUE DES COPIES DE L'ÉTUDIANT (Max 20 lignes - Pagination intégrée)             │
│  ┌────────────────────┬─────────────────┬─────────────────┬──────────────┬───────────┐ │
│  │ Date de soumission │ Code d'examen   │ Thème / Sujet   │ Note Globale │ Actions   │ │ <-- 6. Interactive Submissions List
│  ├────────────────────┼─────────────────┼─────────────────┼──────────────┼───────────┤ │
│  │ 09/06/2026 à 14:15 │ Combinaison 1   │ Cohabitation... │ C1 (IA)      │ [Détails] │ │
│  │ 04/06/2026 à 11:30 │ Combinaison 2   │ Voyage...       │ B2 (IA)      │ [Détails] │ │
│  └────────────────────┴─────────────────┴─────────────────┴──────────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Visual Analytics Specifications (Tracking Recurrence & Consistency)

To give platform managers absolute clarity on the student's preparation progression, the analytics block is divided into three distinct, responsive charts. These charts are optimized to **visually display the level of recurrence and active training consistency** based on the chosen scope.

### A. Dual-Application Target Environments

These specifications must be implemented in **two distinct administrative workspaces** using dynamic data scoping:

1. **The Main Administrative Dashboard (`/admin/dashboard`):**
    - **Scope:** Cohort-Wide Aggregate Data.
    - **Function:** Renders overall platform analytics. The charts aggregate historical records from *all* active candidates, displaying average submission trends, global sub-test distributions, and general platform engagement.
2. **The Dedicated Student Auditor Page (`/admin/audit/:studentId`):**
    - **Scope:** Single-Candidate Telemetry.
    - **Function:** Filters and displays individual candidate diagnostics. The charts render the specific candidate's personal progression, task competency metrics, and private daily study streaks.

## 5. Dedicated Student Page Sub-Components & Interactions

This section outlines specific functional controls and live telemetry widgets required to manage candidate properties.

### A. Target Application Environment

These telemetry components are rendered exclusively on **Target Page B: The Dedicated Student Auditor Profile Page (`/admin/audit/:studentId`)**. They are positioned directly beneath the metadata profile bar, within the Quota Progress and Activity blocks, ensuring admins can inspect target candidate indicators on a clean, unified workspace.

### B. Expiry & Validity Calculators

- **Dynamic Time Check:** The page displays the dynamic countdown value (e.g., `42 jours restants`) by comparing the client system date to the profile's `expiration_date` attribute.
- **Alert Thresholds:** If the expiration window falls below 7 days, the validity text automatically shifts from slate grey to a pulsating crimson, alerting the admin to discuss plan renewal during their audit.

### C. Dynamic Quota Progress Bar (Live Real-Time Sync)

- **The Problem:** When a student completed a simulation on their interface, the database written progress did not automatically propagate to update the administrator's dashboard quota columns and progress bars, leaving administrative records stale.
- **The Live Solution:** Both the dedicated Auditor page and the main User Directory table subscribe directly to the active user profile document. When a student completes an exam, their `current_simulations_used` value increments. The administrative view catches this update instantly, flashing the candidate's row with a highlight and updating their progress counters (e.g., from `11/80` to `12/80`) in real time.
- **The Bar Layout:** A horizontal visual container illustrating the remaining attempts quota (e.g., `12 / 80 simulations complétées`).
- **Visual Sizing:** The fill ratio matches the calculation:

$$\text{Fill Ratio \%} = \left( \frac{\text{current\_simulations\_used}}{\text{max\_simulations\_quota}} \right) \times 100\%$$

## 6. Dynamic Filter Mapping & Data Slicing Logic (Main Dashboard)

When the administrator toggles between the filter pills on the main dashboard (**Aujourd'hui**, **Hier**, **Avant-hier**, **Tout**), the layout filters the database arrays directly in browser memory using the following date rules:

### A. Pill 1: "Aujourd'hui" (Today)

- **Under-the-Hood Range:** Slices data from `00:00:00` of the current calendar day to the present second.
- **UI Updates:**
    - **Étudiants Inscrits:** Displays the count and profiles of candidates who registered today.
    - **Soumissions d'essais:** Shows only the written drafts submitted by candidates today.
    - **Combinaisons Créées:** Displays any new exam combinations published by admins today.

### B. Pill 2: "Hier" (Yesterday)

- **Under-the-Hood Range:** Slices data strictly between `00:00:00` and `23:59:59` of the previous calendar day.
- **UI Updates:**
    - **Étudiants Inscrits:** Counts and lists only the candidates whose accounts were provisioned yesterday.
    - **Soumissions d'essais:** Isolates and counts drafts written yesterday.
    - **Combinaisons Créées:** Lists combinations added yesterday, tracking curriculum development velocity.

## 7. Strict 20-Item Pagination Engine

To guarantee memory safety and sleek rendering across all student grids, administrative lookup portals, and candidate lists, enforce a **maximum limit of 20 items per view**. This pagination engine is strictly enforced on the following views:

1. **Main Dashboard Activity Feed (Tableau de bord):** Displays a maximum of 20 latest platform actions, keeping overview load times fast.
2. **Student Auditor Submissions Table (`/admin/audit/:studentId`):** The historical submissions list within each candidate's file is paginated at exactly 20 lines per page.
3. **Question Catalog Manager (Sujets & Combinaisons):** The exam combination cards are rendered in paginated batches of 20 to prevent layout slowdowns.

## 8. Persistent State Preservation Architecture

### A. The Core Requirement

When an administrator performs actions on the dashboard—such as filtering data by "Hier"—this state must be preserved. If they navigate to other pages (e.g., the dedicated Auditor page or the *"Sujets & Combinaisons"* page to edit an exam question) and then click back on **"Tableau de bord"**, the dashboard must re-render exactly as they left it, pre-populated with their active time filters.

## 9. UI Rendering Specifications & Hover Effects

To maintain a consistent, premium dark theme that is visually engaging, apply these design tokens to the filter bar:

1. **State Styling Rules:**
    - **Inactive Pills:** Slate grey outline (`border-slate-850 bg-slate-900/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all duration-200`).
    - **Active Pill:** Bright primary highlight with a glowing border (`border-blue-500 bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] font-bold scale-105 transition-all duration-300`).

## 10. IP Protection & Secured Copying Prevention

For both the **Library View-Only Manuals** and the **`solution_modele`** shown in the student's submission history, add a front-end wrapper to enforce strict confidentiality:

1. **Disable Mouse Selection:** Apply `select-none` (Tailwind) or `user-select: none;` (CSS) styles globally to the containers displaying proprietary study materials.
2. **Block Mouse Gestures & Right-Clicks:** Prevent users from opening context menu utilities to copy, print, or inspect elements:
    - Implement event-interceptor triggers targeting `contextmenu` and `copy` actions, returning `preventDefault()` on click events within container wrappers.
3. **Intercept Keyboard Shortcuts:** Prevent common screenshot/save triggers like `Ctrl+P`, `Cmd+P` (Print), and `Ctrl+S`, `Cmd+S` (Save page):
    - Add a global window-key event listener. When a down-stroke triggers the combination of the Control or Meta key alongside "P" or "S", intercept and block standard browser execution.

## 11. Real-Time Deletion Synchronization Specification (Proposal & AI Solution)

### A. The Structural Problem (Stagnant Deletions)

Currently, when an administrator deletes a record (such as removing a student profile, deleting a combination card, or wiping a submission), the deletion is **not** reflected on other screens in real time. The stagnant data remains visible in the tables and cards until a browser reload is forced, creating desynchronization bugs.

## 12. Target Page C: Admin Questions Page Live Deletion Interface

- **Target Page Route:** `/admin/questions` or `/admin/combinations` (Sujets & Combinaisons).
- **The Specific Update:** Real-time visual feedback for deletion events.

### A. UI Layout & Component Interaction

The questions manager organizes the 80 mock combinations in a clean, multi-column grid list. Each card features an administrative action toolbar on the top-right corner, displaying a red **Supprimer** (Trash) icon button.

## 13. Target Page D: Student History Download Page & Secured PDF Exports

- **Target Page Route:** `/student/history` or `/student/history/:submissionId` (Historique des simulations).
- **The Specific Update:** Secure, candidate-facing local backup downloads.

## 14. Target Page E: User Directory & Management Page (`/admin/users`)

- **Location Route:** `/admin/users` (Gestion des Utilisateurs).
- **Page Role:** Serves as the primary operational user management console. Displays a table listing all platform accounts (max 30 users per row view). Clicking a student's edit row triggers the **User Detail Modal**, containing private candidate information, active parameters, and account controls.

### A. User Information Detail Modal Layout ("Modifier l'utilisateur")

When an administrator triggers user modifications, the system displays the high-fidelity modal window mapping exactly to the system's live structure:

```
┌──────────────────────────────────────────────────────────────┐
│  Modifier l'utilisateur                                      │
├──────────────────────────────────────────────────────────────┤
│  Nom complet                                                 │
│  [ renato marin                                           ]  │
│  Email                                                       │
│  [ ren@gmail.com                                          ]  │
├──────────────────────────────┬───────────────────────────────┤
│  Rôle                        │  Plan                         │
│  [ Étudiant                ▾]│  [ 5 000 F                  ▾]│
├──────────────────────────────┼───────────────────────────────┤
│  Quota simulations           │  Expiration                   │
│  [ 27                     ]  │  [ 06/30/2026               📅]│
├──────────────────────────────┴───────────────────────────────┤
│  Cohorte (optionnel)                                         │
│  [ ex: Janvier2025                                        ]  │
├──────────────────────────────────────────────────────────────┤
│  [█] Corrections IA activées                                 │
├──────────────────────────────────────────────────────────────┤
│  ADMINISTRATIVE SECURITY MODULE (SUPER ADMIN ONLY)            │
│                                                              │
│  • Réinitialiser le mot de passe :                           │
│    [ ✉️ Envoyer un code de validation (OTP) par e-mail ]      │ <-- Action 1: Email OTP Code Trigger
│                                                              │
│  • Forcer un mot de passe temporaire :                       │
│    [••••••••••••] [ Modifier et forcer ]                      │ <-- Action 2: Manual Override Input
├──────────────────────────────────────────────────────────────┤
│                             [ Annuler ]  [ Mettre à jour ]   │
└──────────────────────────────────────────────────────────────┘
```

### B. Secure Authentication Recovery & Override Workflows

To prevent unauthorized account takeovers and maintain operational security boundaries, credential modification actions are protected by strict role authorization:

### 1. Security Gate Policy (Super Admin Gate)

- **Access Rules:** The credentials module inside this modal is **strictly reserved for the Super Admin**.
- **Role Check Hook:** When the modal mounts, the system checks the logged-in administrator's profile role (`role === 'super_admin'`).
    - **If Super Admin:** The GoTrue reset trigger buttons and the manual password inputs are completely interactive and visible.
    - **If Member Admin / Instructor:** The credentials utilities section is completely hidden or replaced with an access warning banner: *"🔒 Modification des identifiants réservée à l'Administrateur Principal."*

### 2. Action 1: Supabase GoTrue Auth Email Recovery Code (OTP) Dispatcher

- **Implementation:** Clicking the OTP reset trigger launches Supabase's native authentication flow on the student's behalf, delivering a 6-digit verification code.
- **Process Flow:** The system reads the selected candidate's target email address and invokes:
    
    ```
    supabase.auth.resetPasswordForEmail(candidateEmail)
    ```
    
    *(Note: The GoTrue Email Template configuration inside the Supabase dashboard must be set to 'token' instead of 'link' or configured to render the recovery token placeholder `{{ .Token }}`).*
    
- **The Verification Stage:** The student receives the secure, short-lived 6-digit OTP code in their email inbox. In the student portal password-reset view, they enter the code into the verification interface, which is evaluated securely on the client-side via:
    
    ```
    supabase.auth.verifyOtp({
      email: candidateEmail,
      token: candidateEnteredOtp,
      type: 'recovery'
    })
    ```
    
    Upon successful verification, Supabase establishes a temporary authenticated session, prompting the student to immediately update and save their new password.
    

### 3. Action 2: Direct Manual Override Option

- **Implementation:** An emergency bypass interface for candidates who have lost access to their registration email address or require manually generated credentials.
- **Process Flow:** The Super Admin enters a plain-text password into the custom input box and clicks "Modifier et forcer". This triggers Supabase's secure Auth Admin override API (`supabase.auth.admin.updateUserById`), replacing the user's password directly in the database Auth schema without requiring access link verification.