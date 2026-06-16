# Technical Specification: Core Platform Upgrades & UI/UX Optimization

**Document Version:** 2.5.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada

This document details the exact functional, visual, and algorithmic updates required to optimize platform performance, fix UI bugs, upgrade the grading schema, deploy a seamless mobile-responsive student portal, and configure payment redirection pipelines.

## 1. Updated CEFR Grading & Appreciation Scale

The AI evaluation engine must transition to this updated, rigorous grading scale. Replace the legacy CEFR assignment conditions with these exact mathematical mappings:

| Cumulative Score (out of 20) | CEFR Band | Qualitative Target Status |
| --- | --- | --- |
| $00.0 \le \text{Score} \le 05.0$ | **A2** | Non Atteint |
| $\text{Score} = 06.0$ | **B1** | Non Atteint |
| $07.0 \le \text{Score} \le 09.0$ | **B1+** | Non Atteint |
| $10.0 \le \text{Score} \le 11.0$ | **B2** | Non Atteint |
| $12.0 \le \text{Score} \le 13.0$ | **B2+** | Non Atteint |
| $14.0 \le \text{Score} \le 15.0$ | **C1** | Atteint |
| $16.0 \le \text{Score} \le 17.0$ | **C1+** | Atteint |
| $18.0 \le \text{Score} \le 20.0$ | **C2** | Atteint |

## 2. Updated AI Prompting & Structured Corrections

The system instructions for the Gemini API must be modified to enforce high-quality, professional educational outputs. Guide the model to respect these three key updates:

### A. Full Rephrased Copy (The Amelioration Layer)

- **The Rule:** The `version_corrigee_et_amelioree` must not be a generic block of text. It must be a **highly refined rewrite of the candidate's original input** (fixing grammatical, stylistic, and syntactic errors) while explicitly maintaining their original intent, ideas, and persona.
- **Marking Guide Integration:** Ensure the AI references the specific **Marking Guide (Critères d'évaluation)** uploaded by the admin inside the prompt's context window.

### B. Structural Formatting Rule (Paragraph Control)

- **The Rule:** As illustrated in `image_674321.png` and `image_674301.png`, the corrected versions must not be generated as flat, unformatted lines. The AI must structure the corrected texts into **clear, logical paragraphs** separated by clean line breaks (`\n\n`) to teach appropriate essay composition structure.

### C. The Incomplete/No-Answer Guardrail (Critical Edge Case)

- **The Rule:** If a student submits an incomplete response, gibberish, or leaves the input textarea completely **blank**:
    - **DO NOT** let the AI crash, error out, or output a generic error message.
    - **The AI Action:** The AI must automatically **draft the complete solution** for that specific task from scratch, assigning a score of `0.0` for that task, but still providing a highly structured, exemplary C1/C2 model solution to teach the student.

## 3. Student Dashboard & Inventory Separation of Concerns

1. **Retain and Rename Progress History:** Do **not** remove the progress history page. Rename it in the student sidebar, page titles, and headers to **"Historique & Progrès"**. This page serves as the exclusive, permanent vault for reviewing completed work.
2. **Rename Combinations Catalog:** Rename the primary testing tab in the student sidebar and page titles. Replace the word *"Combinaisons"* with **"Simulateur d'expression écrite"**.
3. **Remove Legacy "Simulateur":** Delete the outdated, non-functional simulator interface that is no longer in use to prevent platform navigation conflicts.
4. **The Strict State Handover Protocol (Inventory Slicing):**
    - **The Goal:** A student must never see a completed simulation in their active writing queue, and they must never see submitted simulations in their history folder.
    - **Slicing Logic:**$$\text{Slicing Logic}(c) = \begin{cases} \text{Render on "Simulateur d'expression écrite" Only} & \text{if } c \notin \text{Student's Completed Submissions} \\ \text{Render on "Historique & Progrès" Only} & \text{if } c \in \text{Student's Completed Submissions} \end{cases}$$
    - **Visual Action Triggers per Tab:**
        - **Inside "Simulateur d'expression écrite" (Unattempted Workspace):**
            - Renders only cards for combinations the user has *not* submitted yet.
            - Each card displays a primary **"Commencer la simulation"** button to load the live exam arena.
            - Once the candidate clicks this button and submits their drafts, the combination card is **instantly stripped** from this catalog view and transferred to the history vault.
        - **Inside "Historique & Progrès" (Past Records Workspace):**
            - Renders cards for combinations the user has *completed*.
            - Each completed card locks its layout, changes its border styling to a subtle dark blue, displays a "Complété" status badge, and exposes a prominent primary action trigger:
                - `[ 🔍 Voir les détails ]` (View Details: Opens the read-only dynamic correction review page).

## 4. Aesthetics, Styling Clean-Up, & Hover States

To give the application a premium, custom feel, replace default browser elements with customized CSS/Tailwind definitions:

1. **Destroy Harsh White Borders:**
    - Scan every component, table, input border, and card in both the admin and student dashboards.
    - Replace any high-contrast white borders (`border-white` or `border-slate-100`) with soft, semi-transparent dark borders (`border-slate-800/60` or `border-slate-900/40`), blending smoothly with your dark theme.
2. **Inject Custom Hover Transitions:**
    - Add interactive states to all cards, buttons, table rows, and navigation tabs:
        - Apply smooth transition timings (`transition-all duration-300 ease-in-out`).
        - On hover, elevate elements slightly (`hover:-translate-y-1`), brighten text colors, and apply a subtle cyan or blue glow shadow effect (`hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]`).

## 5. UI Responsiveness & Mobile Writing Arena Layout

The writing arena requires a specialized layout on screens under `768px` (mobile devices). Re-arrange the viewport components to stack vertically in this exact sequence:

```
┌────────────────────────────────────────────────────────┐
│  OBJECTIF 4C2                          │ <-- 1. Professional App Header
├────────────────────────────────────────────────────────┤
│  🕒 TEMPS RESTANT: 59:59               │ <-- 2. Top-Aligned Timer
├────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌─────────────────┐ │
│  │ 📁 Tâche 1    │ │ ⚙️ [◀]  [▶]      │ │ <-- 3. Tasks & Sequential Nav (Side-by-Side)
│  └───────────────┘ └─────────────────┘ │
├────────────────────────────────────────────────────────┤
│  Component 5: Prompt Instruction Box   │ <-- 4. Scrollable Active Question
├────────────────────────────────────────────────────────┤
│                                        │
│  Component 6: Secure Typing Editor     │ <-- 5. Fixed Height Textarea Pane
│                                        │
├────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌─────────────────┐ │
│  │ 📊 114 mots   │ │ à â ä é è ê...  │ │ <-- 6. Metrics & Accents Grid (Side-by-Side)
│  └───────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Mobile Layout Hierarchy:

1. **Name of the App Header:** Fixed, responsive text banner at the absolute top.
2. **Remaining Time Bar:** Slim horizontal strip displaying the active countdown.
3. **Tasks and Navigation (Side-by-Side Grid):**
    - Since mobile screens lack horizontal width, display a slim dropdown select box for tasks (Tâche 1, 2, 3) side-by-side with two compact navigation icon buttons `[◀]` and `[▶]`.
4. **Active Tâche Question:** Padded instructions container.
5. **Text Area:** The primary typing block.
6. **Metrics and Special Characters (Side-by-Side Grid):**
    - Place the live **Word Counter** box directly side-by-side with a compact scrollable **Virtual Accents Keyboard**, keeping all helper tools within reach on a single screen without scrolling.

## 6. Secure Routing, Loading States, & Processing Indicators

To eliminate user friction and prevent students from re-entering active simulator state frames post-submission:

1. **App-Wide "Processing Action" Custom Loader:**
    - Whenever a user triggers a database transaction or routes to another page (such as selecting an exam combination, loading a profile modal, or generating a diagnostic card):
    - Mount a beautiful, lightweight custom activity loading indicator (e.g., a rotating green circular ring or custom pulse line) to provide immediate visual feedback that the platform is actively processing their action.

## 7. Home Page Pricing Updates & WhatsApp Conversion Hookup

Evolve your landing page to reflect your revised product pricing tiers, and configure them to route purchase inquiries directly to your operations team via WhatsApp.

### A. The Three Active Pricing Tiers (Pricing Cards)

Update the landing page's horizontal pricing grid to display these exact parameters:

- **Plan de Base (5 000 F CFA):**
    - Core Deliverables: **40 Sujets d'entraînement + Solutions d'examens rédigées**.
    - Permissions: Full access to the simulator modules for **Tâche 1, Tâche 2, and Tâche 3**.
- **Plan Pro / Premium (10 000 F CFA):**
    - Core Deliverables: **80 Sujets d'entraînement + Solutions d'examens rédigées**.
    - Permissions: Full access to the simulator modules for **Tâche 1, Tâche 2, and Tâche 3**.
- **Plan Élite / VIP (3 000 F CFA):**
    - Core Deliverables: **120 Sujets d'entraînement + Solutions d'examens rédigées**.
    - Permissions: Full access to the simulator modules for **Tâche 1, Tâche 2, and Tâche 3**.

### B. Developer Implementation: Setting up the WhatsApp Redirection

Rather than routing candidates to a public sign-up form, clicking the **"S'inscrire"** or **"Choisir ce plan"** button on a pricing card must automatically construct a custom, pre-filled WhatsApp link pointing to your phone number: `650241086` (Cameroon Country Code: `237`).

### 1. The Dynamic URL Builder Code (For the Developer)

Instruct Ronsard to attach this click behavior to your Pricing Card buttons:

```
const handlePlanSelection = (planName, price) => {
  const phoneNumber = "237650241086"; // Formatted with country code, without '+' or leading zeros
  const message = encodeURIComponent(
    `Bonjour OBJECTIF 4C2, je souhaite souscrire au *${planName}* (${price} F CFA) pour commencer mes simulations d'expression écrite du TCF Canada. Veuillez m'indiquer la procédure d'activation.`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  // Opens WhatsApp directly on mobile or web browser safely
  window.open(whatsappUrl, "_blank");
};
```

## 8. Export Integrity: Organized Solution PDFs

The print-ready **Solution PDF Generator** must follow a clean, structured multi-page layout. Apply these design parameters to the PDF layout output:

1. **Chronological Structure:** Ensure tasks are strictly printed in order from Tâche 1 to Tâche 3.
2. **Page Boundaries:** Apply CSS `page-break-inside: avoid;` to your Task Feedback containers to ensure a single task is never awkwardly split across two pages.
3. **Format Layout:** Each task section in the printed PDF must render with standard headers:
    - **Header Block:** Tâche title and candidate's score.
    - **Section A:** Verbatim candidate response.
    - **Section B:** Structural CEFR qualitative reviews (Comprehension, Methodology, Linguistic Level, Appreciation).
    - **Section C:** Clean correction tables mapping specific error lines to grammatical solutions.
4. **Inclusion of Model Solution:** To ensure students have a comprehensive physical copy to study offline, the PDF generator **must include the `solution_modele` (the admin exemplary solution)** in a dedicated, prominent section at the end of each task's layout. Ensure this is labeled clearly as *"Solution Modèle de Référence (Correction Expert C2)"*.

## 9. Database Persistence & Historical Retrieval of AI Diagnostics

To ensure a flawless academic trajectory trace, every single evaluation must be permanently recorded and queryable.

### A. The Storage Mandate

Once the Gemini API completes its evaluation, the resulting structured JSON correction sheet must be stored permanently in your Supabase database. The platform **must never** re-run AI calls for previously completed tasks, which would waste credit quotas and compromise score consistency.

### B. Database Schema Requirements (`submissions` table)

Ronsard must ensure that the `submissions` schema includes these exact data fields:

- `id` (UUID, Primary Key)
- `student_id` (UUID, Reference to `profiles.id`)
- `combination_id` (UUID, Reference to `combinations.id`)
- `student_responses` (JSONB: Storing the verbatim texts written by the candidate for Tâche 1, Tâche 2, and Tâche 3)
- `ai_evaluation_data` (JSONB: Storing the complete, parsed JSON output returned by the Gemini Edge Function)
- `global_score` (Numeric: Storing the overall final score out of 20, e.g., `8.8`)
- `global_level` (Text: Storing the mapped CEFR band, e.g., `B1`)
- `status` (Text: `pending` | `processing` | `completed` | `failed`)
- `created_at` (Timestamp with timezone)

### C. The History Detail Retrieval Flow

1. When the student navigates to **"Historique & Progrès"**, the interface queries the `submissions` table, filtering strictly by their authenticated ID (`student_id`), ordered chronologically (`created_at DESC`).
2. Selecting a completed card and clicking **`[ 🔍 Voir les détails ]`** routes the student to a dedicated read-only evaluation page layout (`/student/history/:submissionId`).
3. **Visual Experience & Zero API Calls:**
    - This page is visually identical to the dynamic post-submission correction dashboard.
    - It populates all visual elements—including the Global Metrics header (Score out of 20, CEFR Band, and Appreciation), task-by-task text blocks, orthographic correction tables, and the ameliorated C1/C2 sections—by pulling the archived payload directly from the `ai_evaluation_data` column in database memory.
4. **Unified Navigation Action Header (The Toolbar):**
At the absolute top of this detailed review page, render a high-contrast horizontal action toolbar containing three specific action buttons:
    - **`[ 📁 Quitter la correction ]`** (Closes the detailed view and redirects the student cleanly back to their **"Historique & Progrès"** page list).
    - **`[ 📁 Solution Modèle de Référence ]`** (Launches the Typical Correction modal drawer containing the official admin exemplary answers).
    - **`[ 📥 Télécharger le PDF complet ]`** (Triggers the print layout compiler, running Section 8's PDF generator script).

### D. The typical Correction Modal (Typical Admin Exemplar Drawer)

When the student clicks the `[ 📁 Solution Modèle de Référence ]` button inside Section C's toolbar, a clean, professional, dark overlay modal mounts. To ensure the candidate can study their errors and review target solutions, the modal organizes and renders the administrator exemplary solutions chronologically:

- **Tâche 1 Section:**
    - Displays the original Tâche 1 prompt question.
    - Displays the target word constraints: *60 mots minimum / 120 mots maximum*.
    - Displays the complete, verbatim administrator-provided typical correction (`solution_modele` for Task 1).
- **Tâche 2 Section:**
    - Displays the original Tâche 2 prompt question.
    - Displays the target word constraints: *120 mots minimum / 150 mots maximum*.
    - Displays the complete, verbatim administrator-provided typical correction (`solution_modele` for Task 2).
- **Tâche 3 Section:**
    - Displays the original Tâche 3 prompt question.
    - Displays the target word constraints: *120 mots minimum / 180 mots maximum*.
    - Displays the complete, verbatim administrator-provided typical correction (`solution_modele` for Task 3).
- **Close Button:** Features a prominent **`[ Fermer ]`** button at the bottom right to dismiss the modal cleanly.