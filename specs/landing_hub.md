# Skill: Canada Pour Tous — Module 1 (Public Landing Hub & Info Portal)

## Purpose & Scope

This skill guides atomic-design implementation of all **public-facing** Next.js pages and components for the *Canada Pour Tous* TEF/TCF Canada exam preparation platform.

It covers:
- Atomic component library (atoms → molecules → organisms → templates → pages)
- Exact routing topology and Next.js App Router conventions
- Visual/aesthetic system (dark, editorial-government, bilingual Canadian brand)
- Supabase auth flow: admin-provisioned only, no self-registration
- Middleware-level route guarding
- Responsive Global Nav, Hero, Feature Cards, Pricing Matrix, and Footer organisms

---

## 1. Design Philosophy & Aesthetic Mandate

**Theme direction:** *Authoritative + aspirational.* This platform serves Francophone Africans preparing to immigrate to Canada — a life-changing decision. The design must signal institutional credibility, clarity, and warmth simultaneously. Think: the precision of a government portal, the energy of a modern edtech product.

**Tone:** Refined dark-mode editorial. Deep slate surfaces. Controlled typographic hierarchy. Red/white Canadian accent system. Clean, disciplined spacing. Not minimalist-cold, not maximalist-noisy — **focused authority**.

**Memorable differentiator:** The Canada flag emoji (`🇨🇦`) as a persistent micro-brand anchor, and the gradient split `Canada Pour Tous` wordmark (red → white) that echoes the bilingual Canadian identity.

### Typography Rules
- **Display/Headings:** `'Sora'` — geometric, modern, confident. Import via Google Fonts.
- **Body/UI:** `'Plus Jakarta Sans'` — warm, readable at small sizes, excellent at French diacritics.
- Never use Inter, Roboto, or system-ui as primary faces.
- French diacritics must render correctly — test: é à ü ç î œ ê

### Colour System (CSS Variables)

```css
:root {
  --brand-red: #E63329;         /* Canada red — CTAs, accents, active states */
  --brand-white: #F5F5F0;       /* Off-white — contrast text on dark */
  --slate-950: #0A0E17;         /* Page background */
  --slate-900: #111827;         /* Card surfaces */
  --slate-800: #1F2937;         /* Elevated surfaces, nav */
  --slate-700: #374151;         /* Borders, dividers */
  --slate-500: #6B7280;         /* Tertiary text */
  --slate-400: #9CA3AF;         /* Secondary text */
  --slate-200: #E5E7EB;         /* Primary body text */
  --blue-600: #2563EB;          /* Login CTA, info highlights */
  --blue-500: #3B82F6;          /* Hover state for blue CTAs */
  --highlight-gold: #F59E0B;    /* "Recommandé" badge accent */
}
```

---

## 2. Atomic Design Component Map

All components live under `src/components/`. Each atom/molecule/organism is a single-responsibility unit with its own file. **No component mixes layout concern with data logic.**

```
src/components/
├── atoms/
│   ├── Badge.tsx               # Pill badges: Recommandé, Populaire, NCLC
│   ├── Button.tsx              # CTA button variants: primary (red), secondary, ghost
│   ├── Icon.tsx                # Thin wrapper for emoji + label combos
│   ├── NavLink.tsx             # Single navigation anchor with hover underline
│   └── SectionLabel.tsx        # Uppercase tracking label (e.g., "Préparation TEF / TCF")
├── molecules/
│   ├── SkillCard.tsx           # Icon + title + description card for the 4 CECRL skills
│   ├── PricingCard.tsx         # Single pricing tier card with feature list
│   ├── NavBar.tsx              # Assembled nav: logo + NavLinks + auth CTA
│   ├── AuthForm.tsx            # Email + password form with loading/error states
│   └── FooterColumn.tsx        # Title + list of links (used in 3-column footer grid)
├── organisms/
│   ├── GlobalNav.tsx           # Sticky nav bar (uses NavBar molecule)
│   ├── HeroSection.tsx         # Full hero with headline, sub, dual CTAs, badge
│   ├── SkillGrid.tsx           # 4-up grid of SkillCard molecules
│   ├── PricingSection.tsx      # Section wrapper for PricingCard grid
│   └── PageFooter.tsx          # Full 3-col footer + legal row
└── templates/
    ├── PublicPageTemplate.tsx  # Wraps: GlobalNav + <main> + PageFooter
    └── AuthPageTemplate.tsx    # Centered card wrapper for login page
```

---

## 3. Atom Specifications

### `Button.tsx`

```tsx
// atoms/Button.tsx
type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[--brand-red] hover:bg-red-600 text-white shadow-lg shadow-red-900/30',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  ghost: 'text-slate-300 hover:text-white',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-8 py-4 text-base rounded-xl',
};
```

**Design rules for Button:**
- `primary` = brand red. Used ONLY for the two main CTAs: hero CTA + nav Connexion button.
- `secondary` = for non-highlighted pricing plan buttons.
- `ghost` = for "Découvrir nos tarifs →" inline text CTA in hero.
- Loading state replaces children with a spinner SVG + locale string (`"Connexion en cours..."`).
- Never use `blue-600` as a primary CTA — that's reserved for the login page (contextual isolation).

### `Badge.tsx`

```tsx
// atoms/Badge.tsx
type BadgeVariant = 'recommended' | 'info' | 'exam';
// recommended → amber/gold, info → slate, exam → red/muted
```

- Max 2 words. No badge longer than 16 characters.
- Position `absolute -top-3 left-1/2 -translate-x-1/2` for cards, `inline-flex` for section labels.

### `NavLink.tsx`

```tsx
// atoms/NavLink.tsx
// Renders a Next.js <Link> with active underline detection via usePathname()
// Mobile: hidden md:block — collapses into hamburger territory (mobile nav is out of scope for Module 1)
```

---

## 4. Molecule Specifications

### `SkillCard.tsx`

Represents one of the four CECRL language components displayed in the info grid.

```tsx
interface SkillCardProps {
  icon: string;          // Emoji icon character
  title: string;         // e.g., "Compréhension Orale"
  description: string;   // 1–2 sentence summary
  href: string;          // Internal route e.g., '/comprehension-orale'
}
```

**Design rules for SkillCard:**
- Background: `bg-slate-900` with `border border-slate-800`.
- On hover: border transitions to `border-slate-600`, subtle `translateY(-2px)` lift (CSS `transition: all 0.2s ease`).
- Icon: rendered in a `44px × 44px` rounded square (`bg-slate-800`) as a contained emoji block — NOT raw inline emoji.
- Title uses `font-sora font-bold text-white text-lg`.
- Description uses `text-slate-400 text-sm leading-relaxed`.
- The entire card is wrapped in `<Link href={href}>` — clicking it routes to the skill detail info page.
- Do NOT add a visible "En savoir plus" button — the card itself is the tap target.

### `PricingCard.tsx`

```tsx
interface PricingCardProps {
  name: string;           // "Tarif Débutant"
  price: string;          // "5 000" (space-separated thousands for French locale)
  currency: string;       // "FCFA"
  duration: string;       // "30 jours"
  quota: string;          // "35 simulations de rédaction"
  hasAiCorrection: boolean;
  buttonLabel: string;
  isHighlighted?: boolean;  // true = "Recommandé" treatment
}
```

**Design rules for PricingCard:**
- Non-highlighted: `border-slate-800`, button is `secondary` variant.
- Highlighted: `border-blue-500 shadow-xl shadow-blue-500/10`, "Recommandé" `Badge` atom, button is `primary` variant (brand red).
- Feature list: Each item uses a green checkmark SVG `✓` at `text-emerald-400`, NOT an emoji ✔️.
- Price display: Integer part at `text-4xl font-black text-white`, currency + duration at `text-slate-400 text-sm`.
- Button links to `/login` — all subscription flows require account provisioning.

### `AuthForm.tsx`

The core login form molecule. Contains inputs, error display, and submit button only. **No routing logic here** — that belongs to the page.

```tsx
interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

**Design rules:**
- Input fields: `bg-slate-950 border border-slate-700 text-white` with `focus:ring-2 focus:ring-blue-500`.
- Error block: `bg-red-500/10 border border-red-500/30 text-red-400` — never `text-red-600` (too harsh on dark).
- The submit Button atom uses the `primary` variant but overrides to `blue-600` (contextual: login page is intentionally blue-toned, distinct from the red-brand public pages — signals you've entered a different mode).
- No "Mot de passe oublié" link in Module 1 — admin provisioning flow has no self-service recovery.

---

## 5. Organism Specifications

### `GlobalNav.tsx`

```tsx
// Assembles: Logo + NavLinks[] + auth CTA Button
// Sticky top-0 with backdrop-blur-md and z-50
// Background: bg-slate-950/80 border-b border-slate-800
```

**Critical UX rules:**
- The logo (`🇨🇦 Canada Pour Tous`) uses a CSS gradient: `from-[--brand-red] to-[--brand-white]` clipped to text. This is the single most recognisable brand element — never simplify to solid text.
- Nav items array is STATIC — defined in layout.tsx and passed as props. No CMS.
- Mobile: nav links hidden below `md:`. Only logo + Connexion button visible on mobile. (Mobile hamburger menu is deferred to a later module.)
- `Connexion` button uses the `primary` variant (brand red) — it is the ONLY non-ghost link in the nav.

**Semantic HTML:**
```tsx
<nav role="navigation" aria-label="Navigation principale">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <Link href="/" aria-label="Canada Pour Tous — Accueil">...</Link>
    <ul className="hidden md:flex items-center gap-6" role="list">
      {navItems.map(item => <li key={item.href}><NavLink {...item} /></li>)}
    </ul>
    <Button variant="primary" size="sm" asChild>
      <Link href="/login">Connexion</Link>
    </Button>
  </div>
</nav>
```

### `HeroSection.tsx`

**Visual composition:** Centred single-column. No background image (performance + clarity). Atmospheric depth via a radial gradient pseudo-element centered behind the headline:

```css
.hero-glow::before {
  content: '';
  position: absolute;
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(230,51,41,0.08) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}
```

**Content order:**
1. `SectionLabel` atom — "Préparation TEF / TCF Canada" (uppercase, red/muted pill)
2. `<h1>` — 4–6 lines max on mobile. French copy. `font-sora font-black`.
3. Body paragraph — `text-slate-400`. 2 sentences max.
4. CTA row — `primary` Button + `ghost` Button side-by-side (stack on mobile).

### `SkillGrid.tsx`

4-column responsive grid. Columns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

**Gap:** `gap-6`. Section has `space-y-12`.

**Section header pattern (reusable across organisms):**
```tsx
<div className="text-center space-y-3">
  <h2 className="font-sora font-bold text-3xl tracking-tight text-white">{title}</h2>
  <p className="text-slate-400 max-w-xl mx-auto text-base">{subtitle}</p>
</div>
```

### `PricingSection.tsx`

Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`. Items stretch to equal height via `items-stretch`.

**Per the Module 1 spec (2-tier pricing update):** The pricing matrix should reflect **1-Month** and **2-Month** pass structures (not 4 plans). Implementation maps to 2 cards but the grid can display 2 side-by-side centred on large viewports (`lg:grid-cols-2 max-w-3xl mx-auto`).

> **⚠️ Pricing Spec Discrepancy:** The implementation guide defines 4 plans (5K/10K/15K/20K FCFA). The Module 1 product spec defines a 2-tier model (1-Month / 2-Month pass). **Use the product spec** (2-tier) as the source of truth. The 4-plan UI in the implementation guide is a prototype artefact — update it.

### `PageFooter.tsx`

3-column grid on `md:+`. Each column is a `FooterColumn` molecule (heading + links list).

**Columns:**
1. Brand blurb + tagline
2. Legal links: CGU, Politique de Confidentialité, Cookies
3. Contact block: support email displayed as `<a href="mailto:...">` (not plain text)

Bottom bar: copyright + attribution. `text-slate-500 text-xs`. Copyright year via `new Date().getFullYear()`.

---

## 6. Auth Implementation (Supabase)

### Supabase Client Wrapper

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}
```

### Auth Flow (Login Page)

Route: `src/app/login/page.tsx`

1. User submits `AuthForm` molecule.
2. Page calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success: query `profiles` table for `role` field.
4. Redirect:
   - `role === 'admin' || 'super_admin'` → `/admin`
   - All others → `/dashboard`
5. On error: surface French error message inside `AuthForm`.

**Profiles table schema (minimum):**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'student', -- 'student' | 'admin' | 'super_admin'
  full_name text,
  plan text,                            -- 'debutant' | 'standard' | 'avance' | 'premium'
  quota_remaining integer DEFAULT 0,
  expires_at timestamptz
);
```

### Supabase Dashboard Lockdown Checklist

- [ ] Authentication → Providers → Email → **"Allow new users to sign up"** → **DISABLED**
- [ ] Authentication → Providers → Email → **"Confirm Email"** → **DISABLED** (admin manages this)
- [ ] RLS (Row Level Security) enabled on `profiles` table
- [ ] RLS policy: students can `SELECT` only their own row (`auth.uid() = id`)
- [ ] RLS policy: admins can `INSERT`, `UPDATE`, `SELECT` all rows (via role check)

### Middleware Route Guard

File: `middleware.ts` at project root.

```ts
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

Logic:
1. Instantiate Supabase server client with cookie passthrough.
2. Call `supabase.auth.getSession()`.
3. If no session and route matches `/dashboard` or `/admin` → redirect to `/login`.
4. Return response (with refreshed auth cookies if session exists).

**Do NOT** protect `/login` itself — unauthenticated users must reach it. **Do NOT** protect any `(public)` routes.

---

## 7. Routing Topology

```
src/app/
├── (public)/                          ← Route group: no auth required
│   ├── layout.tsx                     ← Renders PublicPageTemplate organism
│   ├── page.tsx                       ← Landing page (Hero + Grid + Pricing + Footer)
│   ├── comprehension-orale/page.tsx   ← Skill detail info page
│   ├── comprehension-ecrite/page.tsx
│   ├── expression-ecrite/page.tsx
│   └── expression-orale/page.tsx
├── login/
│   └── page.tsx                       ← AuthPageTemplate + AuthForm
├── dashboard/                         ← 🔒 Middlewared (student workspace)
└── admin/                             ← 🔒 Middlewared (admin workspace)
```

**Skill detail info pages** (e.g., `/comprehension-orale`) follow this structure:

```tsx
// Shared shape for all 4 skill detail pages
interface SkillDetailPageData {
  slug: string;
  title: string;
  icon: string;
  duration: string;        // e.g., "35 minutes"
  taskCount: number;       // e.g., 4 tasks
  maxScore: number;        // e.g., 360 points
  nclcMapping: string;     // e.g., "B2 → NCLC 7"
  strategies: Strategy[];  // Array of strategy blocks
}
```

These pages are **static** in Module 1 — no DB fetch, no ISR. Hardcoded content per page.

---

## 8. Responsive Layout Breakpoints

Follow Tailwind's defaults. No custom breakpoints in Module 1.

| Breakpoint | Width | Key behaviours |
|---|---|---|
| Default (mobile) | < 640px | Single-column stack, nav links hidden, hero CTA stacks vertically |
| `sm` | ≥ 640px | Hero CTAs go side-by-side |
| `md` | ≥ 768px | Nav links visible, pricing grid 2-col, footer 3-col |
| `lg` | ≥ 1024px | Skill grid 4-col, pricing grid 4-col |
| `xl` | ≥ 1280px | Max-width capped at `max-w-7xl` centred |

---

## 9. Performance & SEO Rules

- Every public page exports `generateMetadata()` with French `title` and `description`.
- `<h1>` exists once per page — never in nav or footer.
- All images use `next/image` with explicit `width`/`height` (no layout shift).
- Font loading: `next/font/google` with `display: 'swap'` and `preload: true`.
- No third-party analytics scripts in Module 1 (defer to Module 3).
- Skill grid cards and pricing cards are purely CSS-animated (no JS on first paint).

```tsx
// src/app/(public)/layout.tsx — Font configuration
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';

const sora = Sora({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-sora',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
});
```

---

## 10. Copy & Localisation Standards

- All UI copy is in **French** exclusively. No bilingual toggle in Module 1.
- Error messages must be in French: `"Identifiants incorrects ou compte suspendu."` — never English fallbacks.
- Prices display with French number formatting: `5 000` (space as thousands separator), `10 000`, etc. Use `Number.toLocaleString('fr-FR')`.
- Dates and durations use French conventions: `"30 jours"`, `"2 mois"`.
- The footer legal links (CGU, Politique de Confidentialité) are placeholder `<Link>` elements in Module 1 — stub pages created in Module 4.

---

## 11. Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| Using `<form>` without `onSubmit` prevention | Always `e.preventDefault()` in handleSignIn |
| Calling `router.push()` before auth resolves | Await `signInWithPassword` fully before redirecting |
| Hardcoding FCFA prices as plain numbers | Use string `"5 000"` to preserve French formatting |
| Blue as the primary CTA on public pages | Red (`--brand-red`) on public pages, blue only on `/login` |
| Putting data fetching inside organism components | Data fetching stays in page components; organisms receive props |
| Using `getSession()` without refreshing cookies | Always use `createServerClient` with full cookie `setAll` logic |
| Emoji `✔️` in feature lists | SVG checkmark `<svg>` for crisp rendering at all scales |
| `border-radius` on single-sided borders | `border-radius: 0` when using `border-left` only |
| Mobile nav collapses but no fallback shown | Connexion button always visible; nav links hidden on mobile |
| Forgetting `aria-label` on icon-only buttons | Required for screen readers on all interactive elements |