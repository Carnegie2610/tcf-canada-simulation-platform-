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

## Item 5: _(to be added)_
