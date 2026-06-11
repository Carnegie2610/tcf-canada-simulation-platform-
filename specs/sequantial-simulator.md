High-Fidelity Student Exam Arena & Consistency Dashboard Blueprint

Document Version: 1.5.0

Target Developer: Ronsard Carnegie

Project: OBJECTIF 4C2 au TCF Canada (Candidate Portal & Simulator)

This blueprint outlines the visual specifications, layout components, and state logic required to build a premium, highly immersive student exam simulation workspace and consistency dashboard. It is inspired directly by the structural designs in your reference mockups (image_5d56de.png and image_5d56bd.png).

1. Student Dashboard Addition: Consistency & Frequency Tracker

To help candidates stay disciplined for high-stakes immigration exams, we add a Consistency Tracker (Activity Heatmap & Streak Panel) in the student dashboard workspace. This shows at a glance how frequently the candidate executes training sessions.

A. Visual Layout

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔥 VOTRE RYTHME DE PRÉPARATION                                                         │
│  Série active : 5 jours consécutifs   |   Total : 14 simulations complétées            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  Lun   Mar   Mer   Jeu   Ven   Sam   Dim                                               │
│  [█]   [█]   [ ]   [█]   [█]   [█]   [ ]  <-- Semaine en cours                         │
│                                                                                        │
│  Légende: [ ] Inactif  [░] 1 Tâche  [▒] 2 Tâches  [█] Simulation Complète (3 Tâches)   │
└────────────────────────────────────────────────────────────────────────────────────────┘


B. In-Memory Activity Calculation

Calculate the candidate's weekly consistency index by grouping submission logs by date segments and rendering color-coded tiles based on task completion levels (empty, partially complete, or fully complete combination):

const calculateConsistencyStreaks = (submissionsList) => {
  const sortedDates = submissionsList
    .map(sub => new Date(sub.created_at).toDateString())
    .filter((value, index, self) => self.indexOf(value) === index); // Unique dates

  let currentStreak = 0;
  const today = new Date().toDateString();
  
  // Basic streak traversal
  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    if (sortedDates.includes(checkDate.toDateString())) {
      currentStreak++;
    } else {
      break;
    }
  }
  return currentStreak;
};


2. Dynamic Combination Cards: Rich Visual Iconography

Before launching a simulation, cards in the student's catalog must present metadata using distinct, beautiful icons to elevate the visual appeal:

┌─────────────────────────────────────────────────────────────────┐
│ 📝 EXPRESSION ÉCRITE                       [ ⚡ TCF CANADA ]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁 Combinaison 1                                               │ <-- Icon for combination folder
│  Voyage extraordinaire & Cohabitation parentale                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 📋 3 Tâches       ⏱️ 60 minutes       ✍️ 330-450 mots cumulés   │ <-- Multi-icon metadata line
├─────────────────────────────────────────────────────────────────┤
│ [ 🚀 Commencer la simulation ]                                  │ <-- Icon-supported button
└─────────────────────────────────────────────────────────────────┘


Semantic Icon Tokens:

Combination Identifier: 📁 or SVG Folder outline.

Tasks Metric: 📋 or List Check icon.

Timing Metric: ⏱️ or Clock icon.

Word Targets Metric: ✍️ or Pencil icon.

Start Simulation Call-To-Action: 🚀 or Bolt icon.

3. The Focus-Mode Simulation Arena (No-Header Interface)

Once a student clicks "Commencer la simulation", they enter an immersive, distraction-free writing environment optimized to give the workspace maximum horizontal estate.

A. Architectural Rules

Absolute Header Dismissal: The global candidate portal header, sidebar menus, and profile wrappers are completely hidden.

Unified Timer Bar: A high-contrast global top bar showing the running combination name, current active task, cumulative word metrics, and a global countdown timer.

Vertically Stacked Layout (No Split-Screen):

Top Portion (Question Area): Houses the horizontal task tab navigation selectors (Tâche 1, Tâche 2, Tâche 3) with success color indicators (Green dot when word limits are satisfied). Beneath the tabs, the dynamic task prompt instructions (active question) are displayed prominently.

Center Portion (Secure Editor Area): A full-width editor matching the user's workspace, supported by an instant French Virtual Accent Injector above the textbox.

Bottom Portion (Task Navigation Controls): Incorporates sequential Précédent (Previous) and Suivant (Next) navigation buttons in the bottom actions bar alongside the word counter and exit triggers.

Non-Restrictive Exit Paths:

Quitter le test (Exit): Bypasses evaluation, preserves drafts locally, and returns to the dashboard safely.

Soumettre (Submit): Freezes editors, saves to Firestore, and unlocks AI correction.

4. Frontend Simulation Arena Architecture (Descriptive Functional Specification)

To build this vertically stacked workspace with absolute reliability and high fidelity, implement the component logic using the following five core technical specifications.

A. Component State Management Framework

The simulator relies on three primary categories of synchronized local states to preserve session data and track progress:

Active Tab Selector (activeTaskTab): Maintains a string enum (tache_1 | tache_2 | tache_3) that acts as the single source of truth for the workspace. When switched, the layout instantly refreshes the active question, limits, current draft focus, and word counter variables.

Global Timer Countdown (timeLeft): Holds a numeric integer of remaining seconds initialized dynamically from the combination's configuration. It drives a subtraction loop running every 1,000 milliseconds. If the clock hits $0$, it immediately fires an auto-submission sequence.

Draft Inputs State Object (drafts): A consolidated state object mapping each task key to its active text string. This prevents loss of text inputs when switching tabs.

B. Dynamic Synchronizer & Local Crash Recovery

To safeguard candidate responses during sudden connection spikes, browser crashes, or power outages, the component manages an automatic storage pipeline:

On Mount: The component scans browser sessionStorage for a combination-specific backup key (combination_draft_[ID]). If present, it populates the drafts state object instantly.

Autosave Interceptor Loop: Runs on a background interval (e.g., every 10 seconds), converting the active draft state object into a JSON string and writing it directly to local session memory. This runs silently without interfering with candidate input fields or typing speed.

C. Validation & Word-Counting Rules

Language test evaluation requires dynamic, strict word validations:

Regex Word Tokenizer: To count words, split the text string dynamically using a whitespace pattern regex: text.trim().split(/\s+/).filter(Boolean).length. This prevents double spaces or trailing paragraph returns from artificially inflating word counts.

Dual-Bound Verification: The validated status of each task card is calculated dynamically using a minimum/maximum check. For example, Task 1 is valid if and only if $60 \le WordCount \le 120$.

Visual Status Hooks: Each task tab at the top displays a glowing color-coded dot. It transitions to Emerald Green once the current word count satisfies the active task limits, and remains Amber Orange if the input is under the minimum or over the maximum threshold.

D. Accent-Bar Insertion & Cursor Persistence

Candidates using physical QWERTY or international keyboards require rapid access to French accented characters (é, à, è, ù, ç, œ).

Selection Index Tracing: The virtual keyboard utilizes React useRef to target the active editor <textarea>. Clicking an accent character reads the exact DOM element properties selectionStart and selectionEnd.

Text Injector Algorithm: The selected accent character is sliced directly into the string:


$$\text{Text}_{\text{New}} = \text{Text}[0 \dots \text{selectionStart}] + \text{Accent} + \text{Text}[\text{selectionEnd} \dots \text{Length}]$$

Cursor Focus Reset: After mutating the state, the component triggers a micro-timeout to refocus the cursor directly after the newly injected accent character, allowing candidates to type without interruption.

E. Dynamic Layout Flow & UX Navigation Sequence

To guide the student cleanly through the 60-minute session, the interface implements a sequential navigation system:

The Header (Administrative Frame): Renders the combination ID, sub-test metadata, the overall cumulative word count of all three tasks, and the high-contrast countdown timer.

The Question Block (Horizontal Navigation & Instructions): Features a broad, three-column button tab list spanning the full screen width. Selecting a tab updates the instruction view directly above the writing area, displaying the active question prompts within a padded slate card.

The Editor Area (The Writing Canvas): Contains the virtual accent panel and the full-width text input box, designed to maximize typing space and visual clarity.

The Action Footer (Navigation Controllers): Features a balanced, space-optimized controls matrix:

Left: A safe "Quitter le test" exit button that preserves local draft backups so the student can return to the dashboard without being forced to run an AI correction cycle.

Center: Sequential "Précédent" and "Suivant" directional triggers that step candidates through the tasks while maintaining their tab focus state.

Right: A prominent "Soumettre mon évaluation" button that saves responses to the database, freezes inputs, and unlocks the AI scoring queue.

5. Security & Verification Guardrails

When rendering this simulation dashboard, safety measures must block client modifications or script manipulations:

Local State Isolation: All inputs typed within the SimulationArena component must be sealed. Ensure that any parent layout hooks do not mount overlapping modules.

Tab State Integrity: Dynamic values inside drafts must persist cleanly when switching tabs. By maintaining the draft object inside a combined react state, inputs are preserved.

No Direct DOM Extraction: Enforce context prevention inside the text editor pane. Copying and pasting within instructions is disabled globally (select-none block).