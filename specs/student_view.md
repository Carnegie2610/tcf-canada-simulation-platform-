### Module 2: The Candidate Dashboard (Authenticated State)

Once signed in, the user lands on a unified workspace housing exactly four primary navigation quadrants:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CANDIDATE DASHBOARD WORKSPACE                     │
├──────────────────────────────────┬─────────────────────────────────────┤
│  1. EXAM SIMULATION PORTAL       │  2. HISTORY & PROGRESS ARCHIVE      │
│     - Complete Catalog Visible   │     - CEFR Trajectory Graph         │
│     - Quota-Restricted Access    │     - Optional AI Correction Run    │
├──────────────────────────────────┼─────────────────────────────────────┤
│  3. BOOKS & RESOURCES LIBRARY    │  4. BILLING & SUPPORT PORTAL        │
│     - Secured View-Only Canvas   │     - Tier Expiry Tracking          │
│     - Restricted Clipboard       │     - Direct Technical Support      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Sequential Candidate Workflows

### Workflow A: The Simulation Run (Quadrant 1 to Module 3)

This workflow guides a candidate directly from selecting an exam to initiating and submitting their simulation, taking plan limitations into account.

```
┌───────────────────────────────────────────────────────────────────┐
│                      THE SIMULATION RUN FLOW                      │
├───────────────────┬───────────────────────────┬───────────────────┤
│      STEP 1       │          STEP 2           │      STEP 3       │
│ Portal Navigation │ Select & Launch Exam Card │ Submit & Lock     │
└─────────┬─────────┴─────────────┬─────────────┴─────────┬─────────┘
          │                       │                       │
          ▼                       ▼                       ▼
     Click "Exam         Examine topic details       Freeze editor.
    Portal" Card.        and quota status. If        Save draft to DB.
    See all topics.      unlocked, click             Do not force AI
                         "Commencer" to start.       scoring yet.
```

1. **Step 1: Portal Navigation**
    - The candidate logs in and clicks the **Exam Simulation Portal** quadrant card on their main dashboard.
    - **Full Visibility Rule:** The system displays the *complete repository* of mock training topics to the user, showcasing the richness of the platform.
2. **Step 2: Select & Launch from Quota-Managed Card**
    - Each card displays the prompt title, sub-test target, maximum duration ($40$ or $60$ minutes), required word limits, and high-level instructions directly on its face.
    - **Plan Constraints:** The UI clearly highlights the user's active consumption (e.g., *"3 of 35 simulations used"*).
    - **Eligibility Check:** If the student is within their plan's limits (e.g., hasn't exceeded 35 unlocked simulations), the button displays **"Commencer la simulation"**. If they have reached their limit or are on an inactive tier, the locked topics are grayed out, displaying a CTA to contact support or upgrade.
    - **Single-Attempt Logic:** Completed topics are visually grayed out with a locked indicator. The button changes to "Soumis", and selecting a completed card redirects the user directly to the History quadrant for review.
3. **Step 3: Submission & Locking**
    - The candidate writes their draft within the secure editor. Upon clicking **"Soumettre mon évaluation"** (or automatically when the timer reaches $00:00$), the input field freezes, and the submission is saved to the database.
    - **Non-Mandatory AI Evaluation:** The submission is successfully archived without forcing an immediate AI evaluation, preventing unintended API usage.

### Workflow B: History, Progress Archive & Optional AI Feedback (Quadrant 2)

This workflow facilitates the retrospective learning process, allowing users to choose when to consume their AI evaluation resources.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             THE FEEDBACK & LEARNING LOOP                                  │
├───────────────┬─────────────────┬─────────────────┬───────────────────┬───────────────────┤
│    STEP 1     │     STEP 2      │     STEP 3      │      STEP 4       │      STEP 5       │
│  Access past  │  View Progress  │ Open Historical │  Trigger Optional │  Study Native     │
│  Submissions  │   Metrics Graph │ Drilldown Sheet │   AI Correction   │  C2 Exemplar Text │
└───────┬───────┴────────┬────────┴────────┬────────┴─────────┬─────────┴─────────┬─────────┘
        │                │                 │                  │                   │
        ▼                ▼                 ▼                  ▼                   ▼
   Click History    Inspect CEFR    Select specific    (Optional) Click    Read corrective model
   & Progress card  trajectory path    past attempt     "Demander une      to write better next
                                                       correction IA" to
                                                       generate report.
```

1. **Step 1: Archive Entry**
    - The candidate clicks the **History & Progress Archive** quadrant on their dashboard.
2. **Step 2: Progress Analytics Review**
    - The page displays a visual trajectory graph compiled from drafts that *have* been evaluated.
3. **Step 3: Drilldown Selection**
    - The candidate scrolls to their chronological table and clicks a specific past attempt (e.g., *"Draft 2 - Fait Divers"*).
4. **Step 4: Optional AI Correction Trigger**
    - The detail view displays the user's raw submitted text.
    - **On-Demand AI Action:** If this draft has not yet been evaluated, the interface presents a prominent, non-mandatory action: **"Demander une correction par l'IA"** (Request AI Correction).
    - **Processing:** Clicking this triggers the server-side AI evaluation engine. Once generated, the UI dynamically expands to show localized grammatical, syntactic, and structural spelling feedback side-by-side with their original text.
5. **Step 5: Model Mastery (Exemplar Comparison)**
    - The candidate reviews the native-level ($C2$) optimized variant of their text ("Modèle Corrigé") returned by the AI to learn how to improve.

### Quadrant 3: Books & Resources Library (IP Protection Vault)

- **Curriculum Resources:** High-value reference manuals, structural frameworks, prep templates, vocabulary word lists, and sample sentence patterns.
- **Zero-Export Security Canvas:**
    - To prevent users from scraping or distributing proprietary materials, all documents are locked in a view-only canvas container.
    - *Enforced Restrictions:* Client-side triggers disable right-click interactions, block clipboard copying, suppress text-selection highlights, and intercept print/save keyboard shortcuts (e.g., `Ctrl+P`, `Cmd+S`).

### Quadrant 4: Billing & Support Portal (Combined)

- **Access Status Monitor:** Displays active subscription info (e.g., *"Tarif Mensuel - Active"*), active simulation consumption counters (e.g., *"12 / 35 simulations completed"*), and account expiration timestamps.
- **Integrated Support Desk:** A communication channel where candidates can submit technical issues, report system bugs, or directly request curriculum assistance from administrators.