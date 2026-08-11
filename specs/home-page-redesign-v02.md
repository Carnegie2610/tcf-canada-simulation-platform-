# Home Page Redesign — v02

This document tracks the list of home page updates for this round. Each item is detailed enough to be executed independently. Items will be approved and implemented one by one — do not start implementation until explicitly told to proceed on a given item.

---

## Item 1: Remove the visible line at the bottom of the header

**Status:** Pending approval

**Problem:** A visible line (perceived as white/bright) appears along the bottom edge of the sticky header, most noticeable when the page is scrolled and hero content passes underneath it.

**Root cause:** `src/components/organisms/GlobalNav.tsx:14` applies `border-b border-[--slate-800]` on the `<header>` element. `--slate-800` (`#1F2937`, defined in `src/app/globals.css:8`) is a dark slate gray, not literally white. However, the header also uses `bg-[--slate-950]/80` (80% opacity) plus `backdrop-blur-md`. When bright hero content (including the `.hero-glow` radial glow from `globals.css:35-46`) scrolls behind the semi-transparent header, the border can visually read as a bright/glowing line against the dark background.

**Files involved:**
- `src/components/organisms/GlobalNav.tsx` (line 14 — the `border-b border-[--slate-800]` class)
- `src/app/globals.css` (reference only — `--slate-800` token definition, `.hero-glow` pseudo-element)

**Proposed fix:**
1. Remove `border-b border-[--slate-800]` from the `<header>` className in `GlobalNav.tsx`.
2. If a separation between header and content is still desired, replace it with a subtler alternative that won't brighten under the blur/opacity stack — e.g. a solid (non-transparent) header background, or a very low-opacity border color that's tested against scrolled content rather than a flat token.
3. Re-check visually with the mobile menu open/closed and while scrolling past the hero glow to confirm no bright edge remains.

**Verification:**
- Run `npm run dev`, open the home page, scroll down so hero content passes under the sticky header, and visually confirm the line is gone or no longer reads as bright/white.
- Check both light and dark viewing conditions if the site supports any theme variation.

---

## Item 2: Increase nav item text size

**Status:** Pending approval

**Problem:** The desktop nav links ("Fonctionnalités", etc. — items passed into `GlobalNav`) currently render too small to read comfortably.

**Root cause:** `src/components/atoms/NavLink.tsx:18` hardcodes `text-sm` on each nav link's `<Link>` className.

**Files involved:**
- `src/components/atoms/NavLink.tsx` (line 18 — `text-sm` class)
- `src/components/molecules/NavBar.tsx` (line 44 — the `<ul>` wrapping nav items, for spacing adjustments if the larger text causes crowding)

**Proposed fix:**
1. Change `text-sm` to `text-base` (or `text-[15px]`/`text-md` equivalent) in `NavLink.tsx`.
2. Re-check the `gap-6` spacing on the `<ul>` in `NavBar.tsx:44` — with larger text, gap may need to increase slightly (e.g. `gap-7` or `gap-8`) to avoid the links feeling cramped.
3. Confirm the active-state underline (`after:` pseudo-element) still aligns correctly under the larger text.

**Verification:**
- Run `npm run dev`, view the home page header at desktop width (`md:` breakpoint and above), and confirm nav item text is visibly larger and still fits without wrapping or overlapping the logo/buttons.

---

## Item 3: Add a glowing "S'INSCRIRE" button next to Connexion

**Status:** Pending approval

**Problem:** The header only has a "Connexion" (login) button. There is no dedicated sign-up call-to-action, and the header needs an eye-catching element to drive registrations.

**Files involved:**
- `src/components/molecules/NavBar.tsx` (lines 52-55 — the button group container next to the mobile menu)
- `src/components/atoms/Button.tsx` (variant styles, lines 14-18 — may need a new `glow` variant or an additional className passed in)
- `src/app/globals.css` (to add a reusable glow animation/utility class, e.g. a pulsing `box-shadow`)

**Proposed fix:**
1. Add a new "S'inscrire" button in `NavBar.tsx`, placed beside the existing `Connexion` button (before or after it — before is more conventional for a primary CTA), linking to the signup route (e.g. `/signup` or `/register` — confirm actual route before implementing).
2. Style it to visually "glow" and attract attention:
   - Use the existing `primary` variant (brand red) as the base, or introduce a distinct `glow` variant in `Button.tsx`.
   - Add a pulsing glow effect via a Tailwind-compatible custom CSS class in `globals.css`, e.g. an animated `box-shadow`/`filter: drop-shadow` keyframe (`@keyframes glow-pulse`), applied as a utility class like `.btn-glow`.
   - Keep the glow subtle enough not to feel like a scam/spam button — a soft pulsing red/white glow consistent with the brand palette (`--brand-red`).
3. Ensure the glow animation respects `prefers-reduced-motion` (disable/soften the pulse for users with that preference set), per accessibility best practice.
4. Confirm layout on mobile — decide whether "S'inscrire" also appears in the mobile menu dropdown or only at `md:` breakpoint and above alongside Connexion.

**Verification:**
- Run `npm run dev`, view the home page header, confirm the "S'inscrire" button renders next to "Connexion" with a visible pulsing/glowing effect.
- Test with OS-level "reduce motion" enabled to confirm the animation is muted/disabled appropriately.
- Click through to confirm it links to the correct signup route.

## Item 4: Remove grey border on the 4 skill cards, add a new visual effect

**Status:** Pending approval

**Problem:** The 4 skill cards ("Compréhension orale", "Compréhension écrite", "Expression orale", "Expression écrite") each have a flat grey border that looks dated/plain and should be replaced with something more visually engaging.

**Root cause:** `src/components/molecules/SkillCard.tsx:15` applies `border border-[--slate-800]` (default) and `hover:border-[--slate-600]` (hover) directly on the card's `<Link>` wrapper.

**Files involved:**
- `src/components/molecules/SkillCard.tsx` (line 15 — the className string with the border classes)
- `src/components/organisms/SkillGrid.tsx` (lines 34-56 — grid layout, no changes expected, reference only)

**Current classes on the card:**
```
group flex flex-col gap-4 rounded-2xl border border-[--slate-800] bg-[--slate-900] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[--slate-600]
```

**Proposed fix:**
1. Remove `border border-[--slate-800]` and `hover:border-[--slate-600]` entirely.
2. Replace with a soft elevation + glow effect on hover, consistent with the brand's red accent and the glowing CTA direction from Item 3:
   - Default state: a subtle ambient `shadow-md`/`shadow-black/20` so the card still reads as a distinct surface against the `--slate-950` page background, without a hard edge.
   - Hover state: swap to a soft brand-colored glow, e.g. `hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]` (using the `--brand-red` tone), combined with the existing `hover:-translate-y-0.5` lift for a "card rising into a glow" feel.
3. Keep `transition-all duration-200` so the shadow/glow animates smoothly with the lift.
4. Verify contrast: the card background (`bg-[--slate-900]`) must still read clearly against the page background (`bg-[--slate-950]`) without the border — confirm the shadow alone provides enough visual separation at rest.

**Verification:**
- Run `npm run dev`, view the skills section, confirm the flat grey border is gone on all 4 cards at rest.
- Hover each card and confirm the new glow/shadow effect displays smoothly without any leftover border flash.
- Check the grid at `sm:` (2-column) and `lg:` (4-column) breakpoints to ensure the effect looks consistent across card sizes.

## Item 5: Add pricing cards for the 2000 and 3000 forfaits

**Status:** Pending approval

**Context:** The pricing section currently shows 3 hardcoded tiers (Découverte 5 000 FCFA, Standard 10 000 FCFA, Excellence 30 000 FCFA). Two additional plans — `PLAN_2000` ("Forfait Essentiel", 2 000 FCFA) and `PLAN_3000` ("Forfait Intermédiaire", 3 000 FCFA) — already exist in the backend config (`src/lib/plans.ts` `ADMIN_ONLY_PLAN_CONFIG`, lines 15-18) and are already allowed by the Supabase `assigned_plan` CHECK constraint and the `schemas-admin.ts` Zod enum, but are currently only used through the admin plan-assignment interface, not shown publicly.

**Files involved:**
- `src/components/organisms/PricingSection.tsx` (lines 3-56 — the hardcoded `tiers` array; lines 72-76 — the render map)
- `src/components/molecules/PricingCard.tsx` (lines 5-16 for the `PricingCardProps` shape, lines 70-131 for card rendering — no changes needed, just reused)
- `src/lib/plans.ts` (lines 15-18 — source of truth for price/quota/duration for these two plans, to keep numbers in sync with the backend)

**Existing data to reuse (from `src/lib/plans.ts`):**
| Plan | Label | Price | Quota | Duration |
|---|---|---|---|---|
| PLAN_2000 | Forfait Essentiel | 2 000 FCFA | 10 simulations | 30 jours |
| PLAN_3000 | Forfait Intermédiaire | 3 000 FCFA | 20 simulations | 30 jours |

**Proposed fix:**
1. Add two new tier objects to the `tiers` array in `PricingSection.tsx`, matching the existing `PricingCardProps` shape (`name`, `price`, `currency`, `description`, `features`, `buttonLabel`, `duration`, and optionally `isHighlighted`/`isSecondary`/`badge`).
2. Use price/quota/duration values sourced from `src/lib/plans.ts` `ADMIN_ONLY_PLAN_CONFIG` (2 000 FCFA / 10 simulations / 30 jours, and 3 000 FCFA / 20 simulations / 30 jours) so the public page stays consistent with the backend config.
3. Write `features` copy consistent with the existing cards' tone (star-prefixed key features get bold/white styling per `PricingCard.tsx`).
4. Decide ordering: likely insert "Forfait Essentiel" (2 000) before "Forfait Découverte" (5 000) as an entry-level option, and "Forfait Intermédiaire" (3 000) between Essentiel and Découverte — confirm final order/positions before implementing since it affects the visual hierarchy of the pricing grid (currently 3 columns, would become 5).
5. Check the pricing grid's layout classes to ensure 5 cards still lay out cleanly (may need to adjust the grid's column breakpoints, e.g. from a 3-column grid to a responsive wrap that handles 5 cards without looking unbalanced).
6. No new button/checkout logic needed — reuse the existing `handlePlanSelection` WhatsApp-prefill flow already used by the other 3 cards, just with the new plan name/price in the prefilled message.

**Open question to confirm before implementing:** should these two plans keep the "admin-only" framing (i.e., DB constraint comment says "admin-only plans (creation interface only)"), or is the intent to now make them fully public/self-serve like the other 3? Since all cards route through a WhatsApp CTA rather than a real checkout, adding them publicly is low-risk and consistent with the existing pattern — but worth a quick confirmation since a prior migration deliberately kept them out of the public config.

**Verification:**
- Run `npm run dev`, scroll to the pricing section, confirm 5 cards render with correct price/quota/duration copy.
- Click each new card's button and confirm the WhatsApp prefill message reflects the correct plan name and price.
- Check responsive layout at mobile, tablet, and desktop widths with 5 cards instead of 3.

## Item 6: Restructure hero section into two columns — text left, image right

**Status:** Pending approval

**Problem:** The hero section currently renders as a single centered text column with no image. The requested layout is a two-column hero: text content (label, heading, paragraph, CTA buttons) on the left, and the image `public/heroimage-1.png` on the right.

**Files involved:**
- `src/components/organisms/HeroSection.tsx` (entire file, lines 1-33 — currently a single `max-w-3xl text-center` centered column)
- `public/heroimage-1.png` (already exists, confirmed present — 2.3MB PNG, should be optimized/served via `next/image` rather than a raw `<img>` for performance)

**Current structure:**
```tsx
<section className="hero-glow relative w-full overflow-hidden px-4 py-28 sm:py-36">
  <div className="relative z-10 mx-auto max-w-3xl text-center">
    <SectionLabel>...</SectionLabel>
    <h1>...</h1>
    <p>...</p>
    <div>...CTA buttons...</div>
  </div>
</section>
```

**Proposed fix:**
1. Change the inner wrapper from a single centered `max-w-3xl` column to a two-column responsive grid/flex layout, e.g. `mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2`.
2. Left column: keep the existing `SectionLabel`, `h1`, `p`, and CTA button group, but left-align the text instead of center-align (remove `text-center`, adjust `mx-auto max-w-xl` on the paragraph since it no longer needs to be centered under a heading).
3. Right column: render `heroimage-1.png` using Next.js `<Image>` (from `next/image`) for automatic optimization/responsive sizing, with appropriate `width`/`height` (or `fill` with a sized wrapper) and a descriptive `alt` attribute.
4. On mobile (`< lg`), stack the columns — text first, image below (or confirm with stakeholder if image should be hidden on small screens to save space/load time).
5. Keep the existing `.hero-glow` background effect; verify it doesn't visually clash with or get hidden behind the added image (may need to constrain the glow to the left/text side, or center it differently now that content isn't centered).
6. Confirm image file size (2.3MB currently) — recommend compressing/converting to WebP for faster load, since `next/image` will optimize on serve but a smaller source is still better practice.

**Verification:**
- Run `npm run dev`, confirm the hero section shows text on the left and `heroimage-1.png` on the right at desktop widths (`lg:` and above).
- Confirm the layout stacks cleanly on mobile without overflow or the image crowding out the CTA buttons.
- Check Lighthouse/Network tab to confirm the image loads as an optimized `next/image` output, not the raw 2.3MB file.

## Item 7: New "Pack Objectif4C2" section after the Hero Section

**Status:** Pending approval

**Context:** This is entirely new content — confirmed via codebase search that no existing component, page, or spec contains this text. A new organism component must be built from scratch and wired into the home page, positioned right after `HeroSection` and before `SkillGrid`.

**Files involved:**
- New file: `src/components/organisms/PackSection.tsx` (name TBD — proposed `PackSection.tsx` or `ReferenceCollectionSection.tsx`)
- `src/app/page.tsx` (lines 9-11 — insert the new section between `<HeroSection />` and `<SkillGrid />`)
- Reference pattern: `src/components/organisms/PricingSection.tsx` + `src/components/molecules/PricingCard.tsx` — closest existing analog (title + subtitle + card grid of feature-list cards), can inform the structure of a new `PackCard` molecule if needed, or a simpler 4-card grid similar to `SkillCard.tsx`/`SkillGrid.tsx`.

**Content (as provided, with the rename applied):**

- **Section title:** "La Collection de Référence pour le TCF Canada"
- **Section subtitle:** "**Pack Objectif4C2** rassemble la collection la plus complète d'exercices TCF Canada, enrichie par une intelligence artificielle de pointe pour une préparation optimale."
- **Card 1 — Pack Objectif4C2** *(renamed from "Pack Ayoub")*: "Exercices officiels des examens 2019-2026, soigneusement sélectionnés pour maximiser vos chances de réussite"
- **Card 2 — Correction IA Avancée**: "Intelligence artificielle calibrée sur les critères officiels TCF pour une évaluation précise et instantanée"
- **Card 3 — Simulation Réaliste**: "Entraînement avec des entretiens oraux reproduisant fidèlement les conditions d'examen officiel"
- **Card 4 — Préparation Intensive**: "Programme complet adapté aux exigences de l'immigration canadienne avec suivi personnalisé"

**Proposed fix:**
1. Create a new organism component (e.g. `PackSection.tsx`) with a section title/subtitle block (similar structure to `SkillGrid.tsx`'s intro) followed by a 4-card grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, consistent with `SkillGrid`'s layout).
2. Every occurrence of "Pack Ayoub" in the provided content is replaced with "Pack Objectif4C2" per this request — including the subtitle sentence and the first card's title.
3. Style cards consistently with the rest of the redesigned page — reuse the same card treatment established in Item 4 (soft shadow/glow instead of flat grey border) rather than introducing a third distinct card style.
4. Insert `<PackSection />` in `src/app/page.tsx` between `<HeroSection />` and `<SkillGrid />`.
5. Decide on icons/visuals per card (none were specified in the provided copy) — default to simple icon glyphs consistent with `SkillCard`'s `Icon` atom (emoji-based) unless a different treatment is requested.

**Open question to confirm before implementing:** no icons or images were specified for the 4 cards — confirm whether to use simple emoji/icon glyphs (matching the existing `SkillCard` pattern) or plain text-only cards.

**Verification:**
- Run `npm run dev`, confirm the new section renders directly below the Hero Section and above the Compétences (skills) section.
- Confirm "Pack Objectif4C2" appears correctly in both the subtitle sentence and the first card title, with no remaining "Ayoub" references.
- Check responsive layout at mobile/tablet/desktop widths for the 4-card grid.

## Item 8: New "Pack Objectif4C2 en Chiffres" stats section (after Item 7's section)

**Status:** Pending approval

**Context:** Another new section, to be placed directly after the "Pack Objectif4C2" section from Item 7. Same rename rule applies: every "Pack Ayoub" reference in the provided copy becomes "Pack Objectif4C2". This content does not exist anywhere in the codebase either (same pattern as Item 7 — new build).

**Files involved:**
- New file: `src/components/organisms/StatsSection.tsx` (name TBD)
- `src/app/page.tsx` — insert between the Item 7 section and `<SkillGrid />`
- Reference pattern: a 4-stat grid, similar in spirit to the 4-card grids already used (`SkillGrid`/`PackSection`), but simpler — big number + label + sublabel per stat, no icons/borders needed necessarily.

**Content (as provided, with the rename applied):**

- **Section title:** "Pack Objectif4C2 en Chiffres"
- **Section subtitle:** "Des résultats qui parlent d'eux-mêmes"

| Stat | Label | Sublabel |
|---|---|---|
| 98% | Taux de réussite | TCF Canada |
| +5 000 | Étudiants formés | Depuis 2020 |
| +5 000 | Exercices disponibles | **Pack Objectif4C2** *(renamed from "Pack Ayoub")* |
| 4.9/5 | Satisfaction | Note moyenne |

**Proposed fix:**
1. Create a new organism component (e.g. `StatsSection.tsx`) with the section title/subtitle, followed by a 4-column stat grid (`grid-cols-2 lg:grid-cols-4`), each cell showing a large bold number, a label line, and a smaller muted sublabel line.
2. Apply the rename: the third stat's sublabel becomes "Pack Objectif4C2" instead of "Pack Ayoub".
3. Style consistent with the page's dark theme — large numbers likely in the brand red/white gradient treatment already used for emphasis elsewhere (e.g. `HeroSection.tsx`'s gradient text), sublabels in muted slate tones (`--slate-400`).
4. Insert `<StatsSection />` in `src/app/page.tsx` directly after the Item 7 "Pack Objectif4C2" section and before `<SkillGrid />` (confirm exact order once Item 7 is implemented).
5. These are static numbers provided as copy — confirm whether they should ever be dynamic/pulled from real data (e.g. actual student count from Supabase) or are intentionally fixed marketing figures. Defaulting to static as given unless told otherwise.

**Verification:**
- Run `npm run dev`, confirm the new stats section renders directly after the Pack Objectif4C2 section (Item 7) and before Compétences.
- Confirm all 4 stats display with correct numbers/labels, and "Pack Objectif4C2" appears (not "Pack Ayoub") in the third stat's sublabel.
- Check responsive layout — likely 2 columns on mobile, 4 on desktop.

## Item 9: New "Préparation TCF Canada" methodology section

**Status:** Pending approval

**Context:** Another new section, positioned after the skill presentation cards (Expression orale/écrite etc. — Item 4's `SkillGrid` section). New content, not currently present anywhere in the codebase (same pattern as Items 7 & 8 — new build). Same rename rule applies: "Pack Ayoub" → "Pack Objectif4C2" throughout.

**Note:** the FAQ block originally provided alongside this content (which referenced the domain `packayoub.com` and Ayoub-branded search phrases) is **excluded from this round** per instruction — no FAQ for now. Only the methodology block below is in scope. If a FAQ section is wanted later, the confirmed domain is `https://www.objectif4c2.com`.

**Files involved:**
- New file: `src/components/organisms/MethodologySection.tsx`
- `src/app/page.tsx` — insert after `<SkillGrid />`

**Content (as provided, with the "Pack Ayoub" → "Pack Objectif4C2" rename applied):**

- Title: "Préparation TCF Canada"
- Subtitle: "Une méthode claire pour progresser dans les 4 épreuves"
- Body paragraph 1: "**Pack Objectif4C2** aide les candidats à préparer le TCF Canada avec des exercices organisés par compétence, des simulations et une correction IA pour l'expression écrite et orale."
- Body paragraph 2: "L'objectif est simple : comprendre le format, s'entraîner régulièrement, corriger ses erreurs et arriver plus confiant le jour de l'examen."
- Bullet list:
  - Parcours pour les 4 épreuves du TCF Canada.
  - Correction rapide pour transformer les erreurs en progrès.
  - Guides publics pour comprendre le format et les scores.
  - Conseils pratiques pour travailler avec méthode.
- Sub-heading: "Pourquoi choisir **Pack Objectif4C2** ?"

**Proposed fix:**
1. Build the methodology block as a text section (title, subtitle, 2 paragraphs, bullet list, sub-heading) — likely reusing left-column text styling patterns already established (e.g. from `HeroSection.tsx` post-Item-6, or `SkillGrid.tsx`'s intro block).
2. Insert `<MethodologySection />` in `src/app/page.tsx` after `<SkillGrid />`.
3. No FAQ, no accordion, no structured data needed for this round.

**Verification:**
- Run `npm run dev`, confirm the new section renders after the skills section, with all rename substitutions correctly applied and no leftover "Ayoub" references.
- Check responsive layout at mobile/desktop widths.

## Item 10: _(to be added)_
