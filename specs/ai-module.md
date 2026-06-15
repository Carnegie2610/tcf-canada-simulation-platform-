# Technical Specification: AI Integration Workflow & Correction Paradigm

**Document Version:** 1.3.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada

This document details the visual interfaces, state workflows, database mappings, and prompt configurations required to implement the automated evaluation system on the student portal.

## 1. Post-Submission Screen Decision Gate

When the countdown timer in the student simulation space reaches `00:00` or when the candidate manually clicks **"Soumettre mon évaluation"**, the active workspace in the middle column transitions to a choice gateway.

Rather than sending the responses to the API automatically, the system displays two explicit options:

### A. Visual Layout

The workspace displays a clean dark background card with two prominent, high-contrast dashboard options:

```
┌────────────────────────────────────────────────────────────────────────┐
│               ÉVALUATIONS CONSERVÉES AVEC SUCCÈS !                     │
│                                                                        │
│ Vos productions écrites ont été enregistrées en tant que brouillon.    │
│ Veuillez choisir l'action suivante :                                   │
│                                                                        │
│ ┌──────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ 🏠 Retourner au Tableau de bord  │ │ 🧠 Obtenir ma Correction IA   │ │
│ │ (Sauvegarde sans correction)      │ │ (Analyse instantanée)         │ │
│ └──────────────────────────────────┘ └───────────────────────────────┘ │
│                                                                        │
│  ⚠️ Note : Demander une correction automatique consommera 1 crédit.   │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Navigation & Button Triggers

1. **Button A: `[ 🏠 Retourner au Tableau de bord ]`**
    - **Route Target:** `/student/dashboard`
    - **Database Action:** Saves the student's text entries with `status = "draft"` or `"unsubmitted"` in the database. No API calls or credit consumption occur.
2. **Button B: `[ 🧠 Obtenir ma Correction Directe ]`**
    - **Database Action:** Sets `status = "pending"`.
    - **Workflow Trigger:** Mounts the full-screen loading state, consumes 1 simulation credit from the candidate's active quota, and calls the Supabase Edge Function to run the AI prompt pipeline.

### C. High-Fidelity AI Loading Screen Experience (The "Intelligence Hub" Loader)

To make the execution phase feel highly advanced, intuitive, and genuinely powered by deep intelligence, replace basic percentage spinners with an **asynchronous "AI Star Core" processing gateway**.

### 1. Visual Anatomy & "AI Sparkle" Particle System

- **Backdrop Layer:** Full-screen midnight-black overlay with a heavy blur effect (`bg-slate-950/85 backdrop-blur-xl z-50 transition-all duration-500`).
- **The AI Core (Centerpiece):**
    - An SVG container rendering a glowing, multi-layered orbital ring cluster spinning smoothly at variable speeds.
    - At the absolute center sits a pulsing, gold-and-cyan "Sparkle Star" icon (`animate-pulse shadow-[0_0_50px_rgba(34,197,94,0.3)]`).
    - **Dynamic Thought Particles (Floating Stars):** Generate a continuous stream of tiny, semi-transparent gold and cyan star vectors drifting slowly outward from the central star core, fading as they reach the outer boundaries. This visually simulates a brain actively compiling ideas and running calculations.

### 2. Progressive AI Analytical States (Micro-Copy Engine)

To eliminate user anxiety and convey a sense of thorough, real-time evaluation, the interface cycles through an array of detailed, highly-relevant progress text labels directly beneath the glowing star core. Each state stays visible for 2.5 seconds before smoothly fading out to reveal the next:

- **State 1:** *🧠 "Vérification des quotas de simulation et initialisation de l'analyseur..."*
- **State 2:** *📝 "Lecture et compilation des copies de Tâche 1, 2 et 3..."*
- **State 3:** *🔍 "Démarrage du diagnostic orthographique et de la détection d'erreurs..."*
- **State 4:** *📊 "Évaluation des critères CEFR (Compréhension, Méthodologie et Cohérence)..."*
- **State 5:** *✍️ "Rédaction de votre version C1/C2 personnalisée..."*
- **State 6:** *💾 "Enregistrement sécurisé de votre diagnostic d'examen dans l'historique..."*

### 3. Transition Finish

Once the background API returns the success code, the loader triggers a smooth transition: the central AI star flashes with a soft green glow, the screen fades to black over `400ms`, the local cache clears, and the client router transitions the student directly to their updated review history.

## 2. The Core AI Evaluation Schema (JSON Schema)

The Gemini API must return a single, minified JSON object matching this exact schema:

```
{
  "global_metrics": {
    "score_final": "string",
    "niveau_cecr": "string",
    "appreciation": "string"
  },
  "task_1_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  },
  "task_2_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  },
  "task_3_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  }
}
```

## 3. Detailed Task Correction Paradigm Fields

For each of the three tasks, the AI evaluator must generate and write these exact fields to the schema:

1. **`comprehension_du_sujet`:** Evaluates if the candidate addressed the prompt accurately or drifted off-topic.
2. **`respect_de_methodologie`:** Verifies layout rules, greetings, structure, and connective logical flow.
3. **`niveau_linguistique`:** Analyzes syntactic density, vocabulary variety, and general grammatical control.
4. **`appreciation_generale`:** Highlights major strengths and constructive coaching paths.
5. **`correction_orthographique`:** An array of error diagnostics. If spelling is pristine, it returns an empty array: `[]`.
    - **`erreur`:** The exact substring containing the error.
    - **`correction`:** The clean, grammatically correct replacement text.
    - **`type`:** Error category classification (e.g., *accord*, *orthographe*, *conjugaison*, *préposition*).
    - **`explication`:** A concise grammatical explanation explaining *why* it was incorrect.
6. **`version_corrigee_et_amelioree`:** A complete rewrite of the draft elevating the candidate's original text to native C1/C2 standards while retaining their core personal intent.

## 4. Grading Formulas & Score-to-CEFR Mapping

The platform establishes strict grading weights across the three writing tasks. Task scores must sum to a maximum total score out of 20:

- **Tâche 1 (Courriel amical):** Scored out of **4.0 points** maximum.
- **Tâche 2 (Article de blog):** Scored out of **7.0 points** maximum.
- **Tâche 3 (Synthèse argumentative):** Scored out of **9.0 points** maximum.

### Mathematical Sum Rule

$$Global\ Score = Score_{Tâche1} + Score_{Tâche2} + Score_{Tâche3}$$

*Example:* $1.8/4 + 2.1/7 + 4.95/9 = 8.85/20$, rounded to **8.8/20**.

### CEFR & Qualitative Appreciation Matrix

The global score maps to these language bands:

| **Cumulative Score (out of 20)** | **CEFR Band** | **Qualitative Appreciation** |
| --- | --- | --- |
| $\ge 18.0$ | **C2** | Excellent |
| $15.0 \le \text{Score} < 18.0$ | **C1** | Excellent |
| $12.0 \le \text{Score} < 15.0$ | **B2** | Suffisant |
| $9.0 \le \text{Score} < 12.0$ | **B1** | Moyen |
| $6.0 \le \text{Score} < 9.0$ | **A2** | Insuffisant |
| $< 6.0$ | **A1** | Insuffisant |

## 5. Production System Prompt (System Instructions)

Use this exact instruction block in the `systemInstruction` configuration of your Gemini instance:

```
You are the Lead Senior Examiner for the TCF Canada writing module at OBJECTIF 4C2. Your role is to evaluate student drafts with extreme rigor, consistency, and professional accuracy.

### STRICT EVALUATION RULES & GRADING METRICS
You must grade the submitted exam across three distinct tasks. Do not deviate from these strict score allocations:
1. Tâche 1 (Courriel amical): Graded strictly out of 4 points. Maximum possible score is 4.0.
2. Tâche 2 (Article de Blog): Graded strictly out of 7 points. Maximum possible score is 7.0.
3. Tâche 3 (Synthèse & Argumentation): Graded strictly out of 9 points. Maximum possible score is 9.0.

The Global Score (score_final) is the absolute mathematical sum of the three tasks:
Global Score = Score_Tâche1 + Score_Tâche2 + Score_Tâche3 (e.g., 1.8 + 2.1 + 4.95 = 8.85, rounded to 8.8/20).

### CEFR & APPRECIATION MAPPING MATRIX
Based on the Global Score out of 20, assign the overall CEFR level and qualitative appreciation tag strictly according to this matrix:
- Score >= 18.0: level "C2", appreciation "Excellent"
- 15.0 <= Score < 18.0: level "C1", appreciation "Excellent"
- 12.0 <= Score < 15.0: level "B2", appreciation "Suffisant"
- 9.0 <= Score < 12.0: level "B1", appreciation "Moyen"
- 6.0 <= Score < 9.0: level "A2", appreciation "Insuffisant"
- Score < 6.0: level "A1", appreciation "Insuffisant"

### REQUIRED TASKS PARADIGM
For each of the three tasks, you must analyze and output these exact fields:
- "score": A string representation of the grade earned out of the task's maximum limit (e.g., "1.8/4", "2.1/7", "4.95/9").
- "consigne": The exact prompt instructions of the task.
- "votre_texte": The verbatim draft written by the student.
- "comprehension_du_sujet": Analyze whether the student understood the prompt's context or went off-topic.
- "respect_de_methodologie": Evaluate structural rules (e.g., salutations, word counts, paragraph distribution, connectivity).
- "niveau_linguistique": Review syntactic maturity, vocabulary richness, and grammar level suitability.
- "appreciation_generale": Summarize strengths and constructive advice.
- "correction_orthographique": An array of spelling, grammar, or preposition errors. For each error, provide:
  * "erreur": The exact erroneous string from the student text.
  * "correction": The corrected word or phrase.
  * "type": The error category (e.g., "accord", "préposition", "conjugaison", "orthographe").
  * "explication": A brief, professional grammatical explanation of why it was wrong and how to fix it.
  * If no errors are found, return an empty array: [].
- "version_corrigee_et_amelioree": Rewrite the student's text to elevate it to a native C1/C2 band, preserving their original intent but upgrading flow and vocabulary.

### RESPONSE FORMAT CONSTRAINT
You must output ONLY a valid, minified JSON object matching the exact schema below. Do not include markdown code block wraps (like ```json), commentary, or leading/trailing text outside the JSON object.

### TARGET JSON OUTPUT SCHEMA
{
  "global_metrics": {
    "score_final": "string",
    "niveau_cecr": "string",
    "appreciation": "string"
  },
  "task_1_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  },
  "task_2_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  },
  "task_3_evaluation": {
    "score": "string",
    "consigne": "string",
    "votre_texte": "string",
    "comprehension_du_sujet": "string",
    "respect_de_methodologie": "string",
    "niveau_linguistique": "string",
    "appreciation_generale": "string",
    "correction_orthographique": [
      {
        "erreur": "string",
        "correction": "string",
        "type": "string",
        "explication": "string"
      }
    ],
    "version_corrigee_et_amelioree": "string"
  }
}
```

## 6. Dynamic User Prompt Template (Input Payload)

Your Supabase Edge Function must compile the student's text inputs into this template before invoking Gemini:

```
Please evaluate the following candidate's written production exam. Analyze each task carefully according to the system rules and return the structured JSON output.

---
### EXAM: LES DEVOIRS À LA MAISON (COMBINAISON 13)

#### TÂCHE 1 (COURRIEL AMICAL)
- Word Constraints: 60 words minimum / 120 words maximum
- Prompt Question:
"Vous souhaitez proposer une sortie culturelle à vos amis. Vous leur écrivez un message pour leur décrire votre projet de sortie (date, lieu, activités, etc.)"
- Candidate's Submitted Text:
"{STUDENT_TEXT_TASK_1}"

---
#### TÂCHE 2 (ARTICLE DE BLOG)
- Word Constraints: 120 words minimum / 150 words maximum
- Prompt Question:
"UNE SOIRÉE POUR SAUVER LA PLANÈTE ! Vous avez assisté à cette soirée. Vous écrivez un message à vos amis pour leur raconter la soirée. Vous leur expliquez pourquoi c'était intéressant"
- Candidate's Submitted Text:
"{STUDENT_TEXT_TASK_2}"

---
#### TÂCHE 3 (SYNTHÈSE ET ARGUMENTATION)
- Word Constraints: 120 words minimum / 180 words maximum
- Prompt Question:
"Dans la rubrique 'Éducation' d'un journal canadien, vous avez lu les deux opinions ci-dessous au sujet des devoirs à la maison après l'école. Vous décidez de réagir à votre tour : vous publiez un article sur votre blog. Votre article comprend deux parties : 1. Vous présentez les deux opinions avec vos propres mots (entre 40 et 60 mots) ; 2. Vous donnez votre avis sur le thème général (entre 80 et 120 mots)."
- Document 1 (Valérie, Mère de famille):
"Grâce aux devoirs à la maison après l'école, seul face à lui-même, l’enfant apprend à devenir autonome. Les devoirs sont également un moyen de rapprocher parents et enfants : réciter une poésie, faire un exercice de mathématiques, c’est souvent un moment de complicité familiale. Enfin, il ne faut pas oublier que les parents ont, eux aussi, un devoir d’éducation. En revanche, because the day at school is already long, it is important that the child does not spend more than fifteen minutes a night doing homework."
- Document 2 (Isabelle, Enseignante):
"J’enseigne à l’école primaire et je ne donne pas de devoirs à la maison. Les devoirs sont une source de stress et de fatigue pour l’enfant. Les élèves ne viennent pas tous du même milieu, les familles n’ont pas toutes le temps ou les connaissances nécessaires pour faire travailler leur enfant. Certains d’entre eux d’un lien entre la famille et l’école. Mais quel lien ? C’est bien souvent un moment d’énervement partagé… Et l’autonomie, elle s’acquiert à l’école, avec des outils pédagogiques pensés par l’école. Pas avec les devoirs à la maison !"
- Candidate's Submitted Text:
"{STUDENT_TEXT_TASK_3}"
---

Remember, output only raw, minified JSON. Evaluate each of the three tasks separately using the required schema fields, calculate the mathematical sum score_final out of 20, map the CEFR level, and return the response.
```