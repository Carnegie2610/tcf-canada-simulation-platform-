# CLAUDE.md — Developer Reference & Code Style Guide

This document defines the local development procedures, core command sets, strict architectural constraints, and code patterns for the **TEF/TCF Canada exam preparation platform**.

---

## 1. Core Developer Command Toolbox

> Ensure you run these commands from the **root directory** of the repository.

### Local Development & Server

| Action | Command |
|---|---|
| Start Local Dev Server | `npm run dev` or `pnpm dev` |
| Production Build | `npm run build` or `pnpm build` |
| Start Production Server | `npm run start` or `pnpm start` |

Runs Next.js local server at `http://localhost:3000`

### Linting & Formatting

| Action | Command |
|---|---|
| Run ESLint | `npm run lint` or `pnpm lint` |
| Run Code Formatter | `npm run format` |

> `npm run format` runs the Prettier config.

### Database Management (Supabase Local Development)

| Action | Command |
|---|---|
| Initialize Supabase Local System | `npx supabase init` |
| Start Supabase Local Docker Engine | `npx supabase start` |
| Apply DB Migrations | `npx supabase db push` |
| Launch Database Visual Studio Panel | `npx supabase studio` |

> `npx supabase studio` runs local PG Admin at `http://localhost:54321`

### Test Suites

| Action | Command |
|---|---|
| Run Unit & Integration Tests | `npm run test` or `pnpm test` |
| Run Test Coverage Analytics | `npm run test:coverage` |

---

## 2. Directory Architecture & Pathing Map

Maintain this strict, modular clean-architecture layout:

```
├── specs/                   # System Blueprint Documents & DB Schemas
├── src/
│   ├── app/                 # Next.js App Router (Routing Engine)
│   │   ├── api/             # Secure backend Route Handlers
│   │   ├── admin/           # Secured Admin Console layouts
│   │   └── dashboard/       # Interactive student workspaces & simulations
│   ├── components/          # Reusable UI modules (Shadcn/ui & custom)
│   ├── hooks/               # Custom React hooks (timers, session tracking)
│   ├── lib/                 # Utility helpers (zod schemas, DOMPurify configuration)
│   │   ├── supabase/        # Supabase client wrapper & types
│   │   └── ai/              # OpenAI structured schema calls
│   └── styles/              # Global styling (Tailwind CSS configurations)
```

---

## 3. Strict Coding Style & Quality Guidelines

### TypeScript & Type Safety

- **Never use `any`** — Absolutely no exceptions. If a dynamic type is needed, use `unknown` or explicitly craft a union type structure.
- **Strict Property Initialization** — Set `"strict": true` in your `tsconfig.json`. Every system class or payload interface property must be explicitly type-mapped.
- **Zod Synchronization** — Every external payload coming from an API, forms, or AI outputs must pass through a Zod schema validation step before executing server computations or state changes.

> Reference schemas: `SubmissionInputSchema` (client drafts) and `DiagnosticReportSchema` (AI scoring payloads) from `specs/data_modeling_blueprint.md`.

### Next.js Routing Boundaries

- **Server Components by Default** — Keep components as React Server Components (RSC) to minimize Client Bundle sizes.
- **Strict Boundary Declarations** — Add `"use client"` only when the module relies on browser API events (e.g., keyboard shortcuts, countdown clocks, Canvas renderings, rich-text tip-tap modules).
- **Middleware-Level Gateway Locks** — Configure `middleware.ts` to block and redirect unauthenticated routes. Do not run client-side JS redirects to secure pages. Unauthenticated requests to `/dashboard/*` or `/admin/*` must fail securely at the middleware level.

### CSS, UI Rendering & The Canvas Shield

- **Tailwind Consistency** — Use Tailwind utility classes for all styling. Avoid custom inline CSS blocks.
- **Mobile-First Flexibility** — Avoid hardcoding static element pixel widths (such as `w-[800px]`). Utilize responsive wrapper definitions (`w-full max-w-4xl px-4`) to ensure rich-text instruction blocks render cleanly on dynamic mobile devices.
- **Non-Selectable Client Containers** — Any container displaying premium manuals or resources must enforce CSS selection shields globally:

```css
.secure-canvas-wrapper {
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}
```

---

## 4. Key Architectural Instructions & Constraints

### Quota Checks & Database Integrity

**Atomic Credit Deduction** — Never write a manual client credit deduction query. Always trigger the database procedure `verify_and_consume_quota(user_id)` inside API routes before initializing a simulation workspace or requesting a diagnostic evaluation.

**The UPSERT Save Pattern** — While candidates type inside the split-screen workspace, save in-progress drafts by executing PostgreSQL database UPSERT commands:

```sql
INSERT INTO public.submissions (user_id, exam_id, user_draft, word_count)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, exam_id) 
DO UPDATE SET user_draft = EXCLUDED.user_draft, word_count = EXCLUDED.word_count;
```

> This prevents duplicate attempt submissions while allowing real-time autosaving.

### Long-Lived AI API Configuration

- **Current Deployment:** Vercel (active). Future migration to a self-hosted VPS via Coolify is planned but not yet active.
- **AI Route Timeout Awareness** — AI evaluation routes (`/api/evaluate`) involve 15–45 second response times. On Vercel, use `max-duration` route config and/or async queue patterns to avoid function timeout limits. When the migration to self-hosted occurs, this constraint is lifted.
- **Strict JSON Outlets** — Always configure OpenAI/Claude API SDKs to use **Strict Mode JSON Output Validation**. Force the output to match the shape of the Zod schemas explicitly before database serialization.

---

## 5. Task Execution Standards

For all subsequent tasks, follow these three steps:

1. **Automated Testing** — Once you write or modify a functionality, immediately create/run a corresponding test script (unit or integration test) via the terminal to verify it passes.
2. **Local Verification** — Provide the exact terminal command, `curl` command, or URL to manually inspect and verify the outcome.
3. **Status Reports** — Provide a direct summary of what was executed, whether the automated builds/tests passed, the specific file locations so changes can be tracked, and a clear overview of how to test it independently.