# Technical Specification: Dedicated Admin Commission Tracker & Revenue Tab

**Document Version:** 1.1.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada (Administrative Portal)

This document details the functional specifications, visual layout, and security routing to implement your 35% commission-tracking system as a **dedicated tab/page** inside the Administrative Portal. This isolates confidential billing payouts from the main overview panel and provides a centralized ledger of your platform earnings.

## 1. Business Logic & Mathematical Rules

For every student registered on the platform, you receive a **35% commission** based on the billing tier they choose. The system must automatically calculate and display these values in F CFA.

The developer must enforce these exact mathematical mappings per registration:

- **Plan de Base (5 000 F CFA):**
    - *Calculation:* $5\,000 \times 0.35$
    - *Your Earned Commission:* **1 750 F CFA**
- **Plan Pro / Premium (10 000 F CFA):**
    - *Calculation:* $10\,000 \times 0.35$
    - *Your Earned Commission:* **3 500 F CFA**
- **Plan Élite / VIP (15 000 F CFA):**
    - *Calculation:* $15\,000 \times 0.35$
    - *Your Earned Commission:* **5 250 F CFA**

## 2. Page Location & Security Access Gate

- **Target Route:** `/admin/commissions` (Accessed by clicking a new, dedicated **"Mes Commissions"** menu item in the administrative sidebar).
- **Role-Based Security Gate (Super Admin Only):**
    - Because this tab displays private financial payouts and platform revenue statistics, it **must be strictly hidden** from standard Member Admins, instructors, or content creators.
    - When mounting the route `/admin/commissions`, the application must check the active administrator's profile role (`role === 'super_admin'`).
    - If the user does not possess Super Admin permissions, the router must bypass this page, redirecting them back to `/admin/dashboard` with a warning notice: *"Accès restreint aux données financières."*

## 3. Dedicated Commissions Tab Workspace Layout

Upon entering the **"Mes Commissions"** tab, the Super Admin is presented with a complete financial overview, tracking temporal gains and showing a clear audit trail of completed student plans.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Mes Commissions                                                                       │
│  Suivi des revenus d'affiliation et des transactions (35% par inscription)             │
│                                                                                        │
│  Filtrer par période: [ Aujourd'hui ]  [ Hier ]  [ Avant-hier ]  [ Tout ]             │ <-- Temporal Filter Bar
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  COMMISSION KPI CARDS (Apply Temporal Filters dynamically)                             │
│  ┌────────────────────────┐ ┌────────────────────────┐ ┌─────────────────────────────┐ │
│  │ 💸 MES GAINS (PÉRIODE) │ │ 👤 INSCRIPTIONS PAYÉES │ │ 📊 REVENUE TOTAL GENERÉ     │ │ <-- New Revenue Cards
│  │ 7 000 F CFA            │ │ 2                      │ │ 20 000 F CFA                │ │ (Cyan Glow Highlight)
│  │ [ +3 500 F vs hier ]   │ │ [ +100% vs hier ]      │ │ [ Lifetime platform sales ] │ │
│  └────────────────────────┘ └────────────────────────┘ └─────────────────────────────┘ │
│                                                                                        │
│  DATA REVENUE TRENDS                                                                   │
│  ┌────────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│  │ PROGRESSION MENSUELLE DES COMMISSIONS   │ │ RÉPARTITION DES PLANS VENDUS (DONUT) │ │ <-- Revenue Trend Graphs
│  │ (Line Chart: Earnings over time)        │ │ (Base vs Premium vs Elite sales)     │ │
│  └────────────────────────────────────────┘ └──────────────────────────────────────┘ │
│                                                                                        │
│  THE COMMISSION LEDGER TABLE                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │ GRAND LIVRE DES COMMISSIONS (Dernières transactions)                             │ │
│  ├────────────────────┬──────────────────┬──────────────────────┬───────────────────┤ │
│  │ Date d'inscription │ Étudiant         │ Formule Choisie      │ Ma Commission     │ │
│  ├────────────────────┼──────────────────┼──────────────────────┼───────────────────┤ │
│  │ 19/06/2026 10:14  │ duplex           │ Plan Premium         │ 3 500 F CFA       │ │
│  │ 18/06/2026 15:30  │ Beatrice         │ Plan de Base         │ 1 750 F CFA       │ │
│  └────────────────────┴──────────────────┴──────────────────────┴───────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4. Functional Behaviors Applied to This Tab

### A. Temporal Filter Synchronization

The metric cards, charts, and transaction lists in this tab respond instantly when the administrator toggles the **Temporal Filter Bar** (Aujourd'hui, Hier, Avant-hier, Tout):

- **Aujourd'hui (Today):** Displays only your share of commissions generated from student registrations completed *today*.
- **Hier (Yesterday):** Displays only your commissions generated *yesterday*, accompanied by a comparative trend badge against the previous day's gains.
- **Tout (All-Time):** Displays your cumulative, lifetime earnings since the launch of the Supabase database ledger.

### B. Dynamic Interactive Trends

- **Monthly Earnings Curve:** A line chart plotting daily and weekly payouts, helping you visualize sales momentum over the current month.
- **Distribution Donut Graph:** Visually maps which of the three plans is converting best (e.g., showing *Premium: 60%*, *Base: 30%*, *Élite: 10%*).

### C. Search & Pagination of the Ledger

- The Ledger table paginates strictly at a **maximum of 15 rows per view** to maintain clean DOM rendering.
- Includes a search input box at the top right of the table to quickly filter transactions by student name or email.

## 5. Back-End & Database Requirements (For Ronsard Carnegie)

To drive this tab securely, Ronsard must update the database schema and queries:

1. **Database Fields (`profiles` or `payments` table):**
    
    Ensure that whenever a student's profile is created or updated in Supabase, the following fields are captured:
    
    - `subscribed_plan` (TEXT: e.g., 'Base', 'Premium', 'Elite')
    - `plan_price` (NUMERIC: e.g., 5000, 10000, 15000)
    - `payment_status` (TEXT: e.g., 'confirmed', 'pending')
    - `created_at` (TIMESTAMP WITH TIMEZONE)
2. **Server-Side Real-Time Hook:**
    
    The commissions tab must subscribe directly to changes in your payment tables. When a student's `payment_status` transitions to `confirmed` in your Supabase DB, your commission counter and transaction row ledger must update live on the page, flashing briefly with an emerald green highlight.