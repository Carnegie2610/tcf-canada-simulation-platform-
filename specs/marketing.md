# Marketing-Driven Pricing Matrix & UI/UX Conversion Blueprint (3-Plan Model)

This document details the updated, high-conversion commercial structures and visual layout specifications for the **Canada Pour Tous** pricing section. It leverages psychological pricing principles (specifically, *Extreme Price Anchoring*, *Value Decoy*, and *Feature Isolation*) to steer users naturally toward the **30,000 FCFA** premium tier or the high-value **10,000 FCFA** intermediate tier.

## 1. The 3-Plan Strategic Matrix

By reducing the options to three clear choices all anchored to a **1-Month (**$1\text{ Mois}$**)** preparation timeline, we eliminate duration confusion while maintaining a clear upward value curve based on features and support.

```
                   [ THREE-TIER VALUE PYRAMID ]

                ┌────────────────────────────────┐
                │       PREMIUM COHORT PATH      │
                │         30,000 FCFA / Mois     │ ◄─── FLAGSHIP TARGET
                │   (Full Live Access, Tutoring,  │      (High Prominence)
                │    40 Simulations + Speaking)  │
                └───────────────┬────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │       SELF-STUDY SMART DEAL    │
                │         10,000 FCFA / Mois     │ ◄─── THE VALUE HOOK
                │   (70 simulations with full    │      (Most Popular Self-Prep)
                │      detailed AI feedback)     │
                └───────────────┬────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │         ENTRY POINT            │
                │          5,000 FCFA / Mois     │ ◄─── BASE DECOY
                │    (35 simulations, no AI feedback)│
                └────────────────────────────────┘
```

## 2. Core Plan Specifications

### Plan A: "Forfait Découverte" (The Base Decoy)

- **Price:** $5,000\text{ FCFA}$
- **Duration:** 1 Month ($1\text{ Mois}$)
- **Target Audience:** Testing the waters / hyper-budget sensitive users.
- **Features Included:**
    - 1 Month of Dashboard Access
    - 35 Written Expression Simulation attempts
    - Standard Reading & Listening Prep Materials (PDFs)
    - Basic self-study system access
- **Marketing Role:** This serves as a *decoy price*. It gets students on the platform, but because it excludes dynamic AI grading and feedback, it naturally motivates users to upgrade to the $10,000\text{ FCFA}$ plan for comprehensive diagnostic support.

### Plan B: "Forfait Standard" (The Smart Value Bundle)

- **Price:** $10,000\text{ FCFA}$
- **Duration:** 1 Month ($1\text{ Mois}$)
- **Target Audience:** Self-motivated candidates who want extensive writing practice with instant, high-fidelity AI evaluations.
- **Features Included:**
    - 1 Month of Dashboard Access
    - **70 Written Expression Simulation attempts**
    - **Full Detailed AI Corrections & Diagnostic Reports** (CEFR levels, grammar fixes)
    - Complete Self-Study Reading & Listening Prep (PDFs)
- **Visual Hook:** High-contrast badge reading: **"LE CHOIX PRATIQUE — 70 SIMULATIONS AVEC IA"**. It targets self-directed learners who want to draft and receive immediate feedback without the high cost of live classes.

### Plan C: "Forfait Excellence" (The Flagship Premium)

- **Price:** $30,000\text{ FCFA}$
- **Duration:** 1 Month ($1\text{ Mois}$)
- **Target Audience:** Serious candidates aiming for maximum NCLC scores who require speaking practice, personalized mentorship, and comprehensive grading.
- **Features Included:**
    - **Pack Compréhension Orale & Compréhension Écrite** (Full modules)
    - **40 Written Expression Simulations** (Full dynamic evaluations)
    - **Interactive Speaking Simulations** (Expression Orale modules)
    - **Personalized Mentorship & Assistance** (Direct coach line / group cohort)
    - **Premium Archives Vault** (Accès aux anciens sujets d'examen réels)
- **Marketing Role:** **The ultimate conversion driver.** This plan is positioned as a complete, worry-free preparation ecosystem. The inclusion of live assistance, speaking exercises, and past exam papers justifies the premium leap.

## 3. UI/UX Visual Hierarchy Guidelines (Tailwind CSS Specs)

To make sure students are highly motivated to choose the **30K** flagship plan or the **10K** value bundle, we must design the layout to highlight these options over the entry-level 5K card.

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     5,000 FCFA          │       30,000 FCFA       │       10,000 FCFA       │
│      1 MOIS             │         1 MOIS          │         1 MOIS          │
│                         │   [ RECOMMANDÉ ]        │    [ MEILLEUR RAPPORT ] │
│  • 35 Simulations       │                         │                         │
│  • No AI feedback       │  • 40 Written Sims      │  • 70 Simulations       │
│  • Standard self-study  │  • Speaking practice    │  • Full AI feedback     │
│  • Reading/Listening    │  • Live tutoring cohort │  • Reading/Listening    │
│                         │  • Past Exam Papers     │                         │
│   [ Choisir Découverte ]│   [ REJOINDRE COHORTE ] │   [ SAISIR L'OFFRE ]    │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### A. The 30K Plan (Visual Spotlight #1 - Premium Gold / Blue Prestige)

The 30K card must look distinct, wider, and more "alive" than the others.

- **Card Styling:** Use a dark slate background but add a prominent cobalt-blue border with an outer shadow aura (`shadow-[0_0_30px_rgba(59,130,246,0.2)]`).
- **Attention-Grabbing Badge:** A top tag in golden text reading: `🏆 FORFAIT RECOMMANDÉ — RÉUSSITE GARANTIE`.
- **CTA Button:** Style it as an active gradient button (`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500`) to draw immediate eye movement upon scrolling.

### B. The 10K Plan (Visual Spotlight #2 - The Smart Self-Study Hero)

The 10K plan is positioned as the most cost-effective alternative for students who don't want live tutoring but need long-term access.

- **Card Styling:** Apply an emerald-green or warm coral border accent.
- **Special Offer Tag:** Place a badge right next to the price saying: `🔥 MEILLEURE OPTION EN AUTONOMIE`.
- **Visual Value Contrast:** Highlight the inclusion of detailed AI feedback prominently to differentiate it from the 5K plan.

## 4. Database Pricing Map Override

The system's user identity metadata registers accounts directly with these simplified plan structures:

```
-- Updated constraints to match exactly the 3 production plans
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_assigned_plan_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_assigned_plan_check
CHECK (assigned_plan IN ('PLAN_5000', 'PLAN_10000', 'PLAN_30000'));
```