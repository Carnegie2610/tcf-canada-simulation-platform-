Strategy & Implementation Guide: Minimal UI Adaptations for Combinations

Target Audience: Ronsard Carnegie (Developer)

This guide provides a low-friction design to update your existing "Créer une question" modal into a full "Combinations" engine without rewriting your UI components or changing the layout structures shown in your screenshot.

1. Visual Mapping: Transforming Your Current Modal

We can map every single visual element from your screenshot directly to the new "Combination (Tasks 1, 2, 3)" structure. This maintains visual consistency with almost zero restructuring.

┌──────────────────────────────────────────────────────────────┐
│  Créer une combinaison                                       │  <-- Renamed Header
├──────────────────────────────────────────────────────────────┤
│  Titre                                                       │
│  [ Combinaison 1 - Expression Écrite                       ]  │  <-- Name of overall exam
├──────────────────────────────┬───────────────────────────────┤
│  Tâche active (Ex-Section)   │  Type d'examen                │
│  [ Tâche 1 (Message/Email) ▾]│  [ TCF Canada               ▾]│  <-- State Switcher / Exam Type
├──────────────────────────────┴───────────────────────────────┤
│  Consigne (sujet)                                            │
│  [ Rédigez un message pour décrire votre appartement...    ]  │  <-- Dynamically loaded question
├──────────────────────────────────────────────────────────────┤
│  Solution modèle (NEW)                                       │
│  [ Salut à tous... [Objective 4c2]                         ]  │  <-- Dynamically loaded model text
├──────────────────────────────┬───────────────────────────────┤
│  Mots min & max (UPDATED)    │  Durée globale (min)          │
│  [ Min: 60 ]  [ Max: 120 ]   │  [ 60 ]                       │  <-- Combined limits & global timer
└──────────────────────────────┴───────────────────────────────┘


2. Minimal UI Element Conversions

Here is exactly how to modify your existing inputs to match your client's request:

A. The "Section" Dropdown ➔ The "Tâche Active" State Switcher

The Current UI: A dropdown menu currently showing options like Section A.

The Revised UI: Keep this exact select element but change the options to:

Tâche 1 (60–120 words)

Tâche 2 (120–150 words)

Tâche 3 (150–180 words)

Under the Hood Logic: When the admin switches this dropdown, the content of the fields below dynamically loads/updates for that specific task. If they type a question for Tâche 1 and switch to Tâche 2, Tâche 1's text is saved in the local state, and Tâche 2's blank or existing content is loaded.

B. "Mots minimum" ➔ "Limites de mots" (Compact Double Input)

The Current UI: A single input field on the bottom left for "Mots minimum".

The Revised UI: Divide that bottom-left space into two smaller half-width inputs next to each other:

Min (e.g., 60 for Tâche 1)

Max (e.g., 120 for Tâche 1)

Default Values: These can be automatically pre-filled based on the selected "Tâche" dropdown value corresponding to the actual chosen task (e.g., Tâche 1, 2, and 3 have different preset defaults).

C. Added Field: "Solution modèle" Textarea

Exclusive Role: This serves as a premium $C1/C2$ marking guide (reference exemplar) shown to the student in their history panel after submission. The AI correction engine relies on a robust system prompt for evaluation, while this field acts as the ultimate human-calibrated reference model for candidate self-correction. The AI does not utilize this field for its automated grading logic.

Security & IP Protection Constraints: Because this model solution represents high-value proprietary intellectual property (IP), it must be guarded strictly:

It must never be available for download.

It must be displayed inside a secure, view-only wrapper in the user's dashboard history panel.

You must disable mouse text selection (user-select: none), right-clicks (contextmenu), and intercept standard copy/print keyboard shortcuts when the student is viewing this solution.

Layout adjustment: Simply duplicate your existing "Consigne" textarea field and place it directly beneath it as "Solution modèle". The height of both textareas can be slightly reduced so the modal stays clean and doesn't require vertical scrolling.

D. "Durée max" ➔ "Durée globale" (Global Timer)

The Current UI: "Durée max (min)" input field.

The Revised UI: Keep it exactly where it is! This value remains a global property (pre-filled with 60 minutes) that applies to the entire combination.

3. Dynamic Local State Handler

To manage this seamlessly inside your modal component without complex state management or database schemas, structure your modal's state object like this:

const [combinationData, setCombinationData] = useState({
  title: "Combinaison 1",
  examType: "TCF",
  globalDuration: 60,
  activeTask: "tache_1", // Controls which task sub-object is being edited
  tasks: {
    tache_1: {
      question: "",
      solution: "",
      minWords: 60,
      maxWords: 120
    },
    tache_2: {
      question: "",
      solution: "",
      minWords: 120,
      maxWords: 150
    },
    tache_3: {
      question: "",
      solution: "",
      minWords: 150,
      maxWords: 180
    }
  }
});


4. Submission Payload

When the admin clicks "Créer" (Create), you write a single unified object containing all tasks to the database under /artifacts/{appId}/public/data/combinations.

This guarantees that launching an exam in the candidate's split-screen simulator requires only one document read operation, maximizing speeds and minimizing Firebase read limits!