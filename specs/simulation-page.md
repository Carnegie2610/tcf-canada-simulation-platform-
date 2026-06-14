# Functional & Visual Layout Specification: Focus-Mode Student Simulation Arena

**Document Version:** 1.3.0

**Target:** Implementation Directive for Code-Generation AI Agent

**Context Reference:** Upgrades layout based on `image_5d56bd.png` and `image_5d56de.png` to meet strict positioning requirements.

This document serves as an absolute structural blueprint to reprogram the student writing arena. The interface is optimized for maximum horizontal space, clear reading lanes, and persistent, static editor panels.

## 1. Absolute Viewport & Grid Layout Rules

To ensure a seamless writing experience, the viewport is locked to prevent global page scrolling. Instead, the screen is split into a multi-column flex layout where specific blocks scroll independently.

- **Global Portal Header:** **MUST NOT BE RENDERED.** All primary sidebar menus, top profile cards, and global navigation headers are completely destroyed upon entering this page.
- **Vertical Partition Ratios:**
    - **Left Column (Controls & Navigation):** Fixed width of **15%** of the viewport width.
    - **Middle Column (Curriculum & Editor):** Dynamically scales to occupy **70%** of the viewport width.
    - **Right Column (Metrics & Input Aids):** Fixed width of **15%** of the viewport width.

### High-Fidelity Differentiated Visual Layout Frame

This ASCII blueprint models the exact layout division, showing how every component must align to prevent clipping:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [OBJECTIF 4C2] ❘ EXAMEN SIMULATEUR             (🟢 SESSION SÉCURISÉE)      🕒 TEMPS RESTANT: 59:59  │ <-- Component 1
├──────────────────────┬────────────────────────────────────────────────────────┬──────────────────────┤
│ GAUCHE (15% Largeur) │ CENTRE (70% Largeur)                                   │ DROITE (15% Largeur) │
├──────────────────────┼────────────────────────────────────────────────────────┼──────────────────────┤
│                      │                                                        │                      │
│ 📁 SÉLECTEUR DE TÂCHE│ ┌────────────────────────────────────────────────────┐ │ 📊 STATISTIQUES      │
│ [ Tâche 1: 60-120w ] │ │ Component 5: ACTIVE TASK PROMPT LISTING            │ │ ┌──────────────────┐ │
│ [ Tâche 2: 120-150w] │ │ (Scrollable Area / Hauteur Max: 250px)             │ │ │  114 mots        │ │ <-- Component 7
│ [ Tâche 3: 150-180w] │ │                                                    │ │ │  Min: 120 Max:150│ │
│                      │ │ Lorem ipsum dolor sit amet, consectetur...         │ │ └──────────────────┘ │
│                      │ └────────────────────────────────────────────────────┘ │                      │
│                      │                                                        │                      │
│ ⚙️ NAVIGATION         │ ┌────────────────────────────────────────────────────┐ │ ⌨️ ACCENTS FRANÇAIS   │
│ [◀ Précédent]        │ │ Component 6: SECURE TEXT EDITOR AREA               │ │ ┌──────────────────┐ │
│ [Suivant ▶]          │ │ (Fixed Height / No Global Scrollbars)              │ │ │ à  â  ä  é  è  ê │ │ <-- Component 8
│                      │ │                                                    │ │ │ ë  î  ï  ô  ö  œ │ │
│                      │ │                                                    │ │ │ û  ù  ü  ç  «  » │ │
│ 🚫 ACTIONS           │ │                                                    │ │ └──────────────────┘ │
│ [ Quitter le test ]  │ │                                                    │ │                      │
│ [ Soumettre l'éval ] │ │                                                    │ │                      │
│                      │ └────────────────────────────────────────────────────┘ │                      │
│                      │                                                        │                      │
└──────────────────────┴────────────────────────────────────────────────────────┴──────────────────────┘
```

## 2. Component-by-Component Blueprint Specifications

### Component 1: Absolute Top App Header & Timer Bar (Professional Branding Edition)

- **Placement:** Placed at the very top of the browser screen, spanning 100% of the horizontal width.
- **Visual Style (Premium Glassmorphic Header Frame):**
    - **Background Layer:** Dark charcoal transparent glass fill (`bg-slate-950/80 backdrop-blur-md`) with a thin bottom border separator (`border-b border-slate-800/60`).
    - **Height:** Fixed slim design (e.g., `56px` or `4.5rem`) to maximize vertical typing space.
- **The "OBJECTIF 4C2" Typography Specification (Professional Branding):**
    - **Branding Element Left Align:**
        - **Font-Family:** Geometric Sans-serif system font (such as *Inter*, *SF Pro*, or *Montserrat*).
        - **Weight & Case:** Ultra-bold uppercase typography (`font-extrabold tracking-widest uppercase`).
        - **Gradient Color Effect:** Styled with a modern gradient. Utilizes a clipped background text gradient flowing from deep corporate blue (`#2563eb`) to high-vibrancy metallic cyan (`#06b6d4`).
        - **Separator & Subtitle:** Flanked by a vertical slate separator bar (`|`) followed by a light-weight, slate-grey sub-badge: `EXAMEN SIMULATEUR`.
    - **Pulsing Session Status Badge:** Next to the brand title, embed a small, professional micro-indicator:
        - A tiny green status dot (`bg-emerald-500 animate-pulse`).
        - Sub-text styled in small uppercase font (`text-emerald-400 font-medium text-xs`): `SESSION SÉCURISÉE (SSL)`.
- **The Timer Countdown Element Right Align:**
    - Displays the remaining test time retrieved dynamically from the exam combination data payload, rendered in a glowing amber monospace typography font (`font-mono text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]`).
- **Behavioral Logic:**
    - The timer runs continuously. If the countdown reaches `00:00`, it locks inputs and automatically triggers the final submission sequence.

### Left Column: Control Panel (15% Width)

### Component 2: Vertical Task Tab Group

- **Placement:** Positioned in the Left Column, directly below the App Header & Timer Bar.
- **UI Structure:** A vertical stack of three cards nested in a single container.
    - **Tâche 1** (labeled with its word limits: *60 - 120 mots*).
    - **Tâche 2** (labeled with its word limits: *120 - 150 mots*).
    - **Tâche 3** (labeled with its word limits: *150 - 180 mots*).
- **Visual States:**
    - The active task displays a bright blue left border accent.
    - A small verification dot changes dynamically to green when the current word count satisfies the task's min/max threshold, and remains amber/orange if unsatisfied.

### Component 3: Sequential Navigator Group

- **Placement:** Nested in the Left Column, directly below the Task Tab Group.
- **UI Structure:** A horizontal button grid grouping **"Précédent"** (Previous) and **"Suivant"** (Next).
- **Behavioral Logic:**
    - Clicking "Suivant" moves the active selector state from Tâche 1 to Tâche 2, and Tâche 2 to Tâche 3.
    - Clicking "Précédent" moves back through the indices.
    - The buttons are disabled programmatically if the candidate is on the first or last task.

### Component 4: Test Actions Container

- **Placement:** Nested at the bottom of the Left Column.
- **UI Structure:** Two highly accessible, full-width action buttons:
    - **"Quitter le test" (Exit):** A secondary red-bordered button. When clicked, it preserves the current drafts in the browser's local cache but skips correction routing, safely returning the candidate to their student dashboard.
    - **"Soumettre mon évaluation" (Submit):** A primary gradient-blue button. It locks the textareas, saves the final submission drafts to Supabase, and triggers the AI evaluation queue.

### Middle Column: Active Writing Canvas (70% Width)

### Component 5: Active Task Prompt Listing (Scrollable)

- **Placement:** Positioned at the top of the Middle Column.
- **Visual Style:** A padded, light slate-colored card containing the full instructions and prompt of the currently selected task.
- **Behavioral Logic:**
    - **Fixed Height with Independent Scroll:** This container must have a fixed maximum height (e.g., `250px` or `30%` of the vertical layout height) with `overflow-y: auto` enabled.
    - No matter how long the administrative question is, it must scroll cleanly *inside this box* so it never pushes down or offsets the text editor below it.

### Component 6: Secure Text Editor Area (Fixed Height)

- **Placement:** Positioned in the Middle Column, directly below the Task Prompt Listing.
- **Visual Style:** A clean, large, full-width `<textarea>` writing field with a dark, high-contrast monospace font.
- **Behavioral Logic:**
    - **Fixed Dimensioning:** This input pane has a fixed height that automatically expands to fill the remaining vertical height of the Middle Column.
    - **No Inner Scrollbars:** The textarea does *not* expand past the viewport boundaries. It is fixed, keeping the cursor visible and preventing the main browser window from scrolling, so the candidate can focus solely on their writing.

### Right Column: Indicators & Special Characters (15% Width)

### Component 7: Unified Word Counter

- **Placement:** Positioned at the top of the Right Column.
- **UI Structure:** A dark, visually cohesive widget box showing:
    - **Current Word Count:** Large glowing count number calculated live via a regex whitespace splitter.
    - **Target Constraints:** Displays the minimum and maximum words allowed for the active task (e.g., *Min: 60 / Max: 120*), retrieved dynamically from the combination database object.
- **Validation Styling:** If the word count is within bounds, the text is green; otherwise, it is crimson/red.

### Component 8: Virtual French Accent Keyboard Grid

- **Placement:** Positioned in the Right Column, directly below the Word Counter.
- **UI Structure:** An elegant, highly accessible grid containing all standard French accent triggers:
`[ à ] [ â ] [ ä ] [ é ] [ è ] [ ê ] [ ë ] [ î ] [ ï ] [ ô ] [ ö ] [ œ ] [ û ] [ ù ] [ ü ] [ ç ] [ « ] [ » ]`
- **Behavioral Logic:**
    - Clicking an accent key reads the active selection cursor point of Component 6's textarea.
    - It instantly injects that accent at the exact cursor index, refocusses the text area, and positions the cursor directly after the inserted character so typing is never interrupted.

## 3. Data Flow & Local State Model

Your AI agent must manage these parameters within a single unified component state to ensure seamless transitions when switching between vertical task tabs:

1. **State Object Structure:**
    - `activeTaskTab`: String value holding the active tab (`"tache_1"`, `"tache_2"`, or `"tache_3"`).
    - `drafts`: An object holding the individual candidate inputs for each task:
        - `tache_1`: String containing the candidate's active email.
        - `tache_2`: String containing the candidate's active blog draft.
        - `tache_3`: String containing the candidate's active argumentation copy.
    - `timerRemaining`: Numeric integer of remaining seconds.
2. **State Protection on Tab Switch:** Switching tabs must *never* clear or reset the text. The state object stores all three draft properties persistently, simply swapping the text displayed in Component 6's textarea based on the `activeTaskTab` key.
3. **Local Recovery Sync (Autosave):** the writing states inside `drafts` must write to the browser's local `sessionStorage` cache on a background loop every 10 seconds. If a connection loss or sudden tab reload triggers, the page parses this cache and restores the drafts instantly.

also do not forget that after the time is over it should automatically end the simulation 