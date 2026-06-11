# Student Dashboard & Live Header Blueprint

**Document Version:** 1.0.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada (Candidate Portal)

This document maps out the visual restructuring of the student workspace, shifting profile and session actions to a modern, top-aligned global header. It provides technical strategies to resolve stale simulation counters through live Firestore synchronization and details feature enhancements to elevate the candidate experience.

## 1. Visual Mockup: The Top-Header Student Workspace

The interface is redesigned to put essential tracking metrics directly in the student's field of view. The profile and sign-out controls are moved from the bottom left to the premium top-right position.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  OBJECTIF 4C2                                [ 42 jours restants ]  [ 12 / 80 simulations ]  [ Jean Dupont ▾ ] │ <-- Live Top Header
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Bienvenue, Jean !                                                                       │
│  Votre préparation pour l'immigration canadienne (TCF / TEF Canada)                      │
│                                                                                          │
├──────────────────────────────────────────┬───────────────────────────────────────────────┤
│  1. ESPACE DE SIMULATION                 │  2. HISTORIQUE & PROGRESSION                  │
│  ┌────────────────────────────────────┐  │  ┌─────────────────────────────────────────┐  │
│  │                                    │  │  │                                         │  │
│  │  • Accéder aux combinaisons        │  │  │  • Consulter vos copies d'examen        │  │
│  │  • 35 sujets déverrouillés         │  │  │  • Consulter les rapports d'évaluation  │  │
│  │  • Lancer un test blanc de 60 min │  │  │  • Étudier les modèles corrigés (C1/C2) │  │
│  │                                    │  │  │                                         │  │
│  └────────────────────────────────────┘  │  └─────────────────────────────────────────┘  │
├──────────────────────────────────────────┼───────────────────────────────────────────────┤
│  3. BIBLIOTHÈQUE DE RESSOURCES           │  4. ABONNEMENT & SUPPORT                      │
│  ┌────────────────────────────────────┐  │  ┌─────────────────────────────────────────┐  │
│  │                                    │  │  │                                         │  │
│  │  • Manuels officiels en lecture-seul│  │  │  • Type de plan : Premium (10 000 CFA)   │  │
│  │  • Fiches de vocabulaire thématique │  │  │  • Contacter un superviseur             │  │
│  │  • Modèles de phrases d'évaluation │  │  │  • Signaler un problème technique       │  │
│  │                                    │  │  │                                         │  │
│  └────────────────────────────────────┘  │  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Dynamic Metric Calculations (The Live Header)

To keep the header metrics accurate without requiring manual page reloads, the client-side dashboard must dynamically calculate and render these variables using real-time database state.

### A. Live Simulation Quota Counter

Instead of drawing a static number, the simulation card and header should subscribe to the user's progress path.

- **Header Tag Visual:** `[ 12 / 80 simulations ]`
- **Condition-driven styling:** If the user gets close to their limit (e.g., 78/80), the background color of the tag dynamically transitions to an amber alert tone. If they hit 80/80, it transitions to a red-locked tone.

### B. Live Days Remaining Calculation

The exact remaining days until subscription expiry must be computed live on the client side using the user profile's `expiration_date` timestamp. Let $Days_{Remaining}$ be calculated dynamically as:

$$Days_{Remaining} = \max\left(0, \left\lceil \frac{T_{Expiry} - T_{Current}}{24 \times 60 \times 60 \times 1000} \right\rceil\right)$$

Where:

- $T_{Expiry}$ is the millisecond epoch timestamp of the user's subscription end date.
- $T_{Current}$ is the current local system timestamp.

## 3. Implementation Strategy for Real-Time Synchronization

To fix the problem of counters not updating instantly when a candidate submits an exam or when an admin updates their quota, transition your data layer from manual fetching (`getDoc`) to an active stream listener (`onSnapshot`).

### A. The Real-Time React Sync Hook

Implement this layout listener hook in your primary `App.jsx` or layout page to stream student data directly to your dynamic header component:

```
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export function useLiveStudentProfile() {
  const [profile, setProfile] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Rule 1 Compliance: Listen directly to user path
      const profileRef = doc(db, "artifacts", __app_id, "users", user.uid, "profile");

      const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          // Perform live calculation of remaining days
          if (data.expiration_date) {
            const expiry = new Date(data.expiration_date).getTime();
            const now = Date.now();
            const differenceMs = expiry - now;
            const computedDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
            setDaysLeft(Math.max(0, computedDays));
          }
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile subscription error: ", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  return { profile, daysLeft, loading };
}
```

## 4. Key Improvements for the Student Experience

To turn this platform into an absolute market leader, here are four high-value functional updates tailored to candidate psychology and test environment conditions:

### Improvement A: Active Connection Guard & Local Autosave

- **The Problem:** Written exams are high-stress. If a student's home internet connection drops for 5 minutes during their 60-minute simulation, they could lose their entire draft, causing massive frustration.
- **The Solution:** Implement a client-side backup mechanism. While the 60-minute countdown timer runs, save the student's active text inputs for Tâche 1, 2, and 3 to `sessionStorage` every 10 seconds.
- **Reconnection Handler:** If the page reloads unexpectedly, detect the active session state and restore their text from the browser cache instantly. Display a reassuring banner: *"Session récupérée avec succès (Sauvegardé localement)"*.

### Improvement B: Dynamic CEFR Target Benchmark (CLB Progress Indicator)

- **The Vision:** Since immigration candidates need CLB 7 to 9 (typically B2 to C1 levels), display a visual "CEFR Target Marker" directly within their dashboard History card.
- **The Mockup:**
    
    ```
    Trajectory: A2 ───> B1 ───> B2 ───[ Target C1 ]───> C2 (Your current level: B2)
    ```
    
    - Once a student's submission gets corrected by the AI, place an encouraging banner explaining exactly what they need to improve (e.g., *lexical diversity* or *cohesion*) to reach the C1 target.

### Improvement C: Interactive Daily Grammar & Vocab Booster

- **The Vision:** Taking a full 60-minute combined test can feel overwhelming on a daily basis. Introduce a fast, micro-learning card in the dashboard.
- **The Feature:** A "Daily Challenge" card featuring a 5-minute active grammar challenge or a "Sentence of the Day" rewrite exercise (e.g., translating an informal sentence into professional-grade C1 French). This builds candidate habits and keeps them logging into your platform every day.

### Improvement D: Real-Time French Accent Input Assistant

- **The Vision:** Many Canadian candidates use physical QWERTY keyboards or computers that lack standard French accented characters (`é`, `à`, `è`, `ù`, `ç`, `œ`).
- **The Feature:** Within the Exam Arena's right-hand input panel, place a floating bar of quick-clickable accent buttons:
    
    ```
    [ é ]  [ è ]  [ à ]  [ ç ]  [ ù ]  [ œ ]  [ « » ]
    ```
    
    Clicking any button instantly inserts that character at the cursor's location in the active text field. This saves them time and prevents spelling score deductions!