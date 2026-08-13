Oral Expression Module — Implementation Steps {#oral-expression-module-implementation-steps}

Companion to the _Feasibility Analysis_ and _Sequence Diagram_ documents. Scope: **Expression Orale only** — 3 tasks (2 min / 2 min / 3 min), one\-shot recording, transcript \+ LLM scoring, PDF correction output.

::: note
**Core rule throughout this plan:** every step tagged **\[VERIFY FIRST\]** must be checked against the live codebase/DB before any code is written — don't build something that already exists. Nobody has queried the live system in the planning conversation this document comes from, so Phase 0 below is the literal starting point, not a formality.
:::

## Phase 0 — Verification & Discovery (no code yet) {#phase-0-verification-discovery-no-code-yet}

Confirm what already exists before anything in later phases is built. Each item resolves to either "reuse/extend" or "build new" — don't assume either way.

- [ ] **\[VERIFY FIRST\]** Inspect `/dashboard` for an existing "Espace Simulation" nav entry and 4\-type module picker (Écrite / Orale / Compréhension Écrite / Compréhension Orale). If it exists, extend it; if not, build it matching existing dashboard visual patterns.
- [ ] **\[VERIFY FIRST\]** Inspect the existing "Expression Écrite" exercise\-list component — confirm whether it's generic (data\-driven) or hardcoded to written content, since Orale needs to reuse the same pattern with different data.
- [ ] **\[VERIFY FIRST\]** Search the codebase for any existing timer/countdown component (even from an unrelated timed feature) before building a new one for the per\-task countdown.
- [ ] **\[VERIFY FIRST\]** Inspect the current admin sidebar "Questions" item's implementation and component structure, so "Question EO" (and the "Question CO"/"Question CE" stubs) can be added the same way rather than as a parallel system.
- [ ] **\[VERIFY FIRST\]** Query the live Supabase schema for the table backing the current Questions/"Question EE" panel — exact column names/types — before adding `modality`, `prep_time_seconds`, `speaking_time_seconds`, or deciding whether a new table is actually needed.
- [ ] **\[VERIFY FIRST\]** Confirm `verify_and_consume_quota(user_id)`'s exact signature/behavior to confirm it can be called unmodified for oral attempts.
- [ ] **\[VERIFY FIRST\]** Read the existing `DiagnosticReportSchema` (Zod) definition, to model `OralDiagnosticReportSchema` consistently rather than inventing an unrelated shape.
- [ ] **\[VERIFY FIRST\]** Read the existing PDF\-correction generation pipeline's input contract (what data shape it consumes) so oral scores can feed into it without modifying or rebuilding it.
- [ ] **Confirmed missing (not a discovery task — just fix it):** login button, admin login, and logout all lack a loading/spinner state. General platform fix, cheap to bundle into this project since it's already been found.

## Phase 1 — Foundations (schema & admin) {#phase-1-foundations-schema-admin}

- [ ] Define `OralDiagnosticReportSchema` (Zod), informed by Phase 0's read of `DiagnosticReportSchema`.
- [ ] Add the timing/modality fields to the question schema — shape depends entirely on the Phase 0 schema query, not decided here.
- [ ] Rename the admin sidebar "Questions" → **"Question EE"**; add **"Question CO"**, **"Question EO"**, **"Question CE"** as new sidebar entries.
- [ ] Build the **"Question EO"** CRUD panel — reusing the EE panel's UI pattern identified in Phase 0. ("Question CO" / "Question CE" are nav placeholders only — no working panel behind them in this build, per confirmed scope.)
- [ ] Enter the actual oral exam questions (task 1/2/3 prompts \+ prep\-time \+ speaking\-time \= 2 min / 2 min / 3 min) once you've supplied them.

## Phase 2 — Student\-facing MVP flow {#phase-2-student-facing-mvp-flow}

- [ ] Fix the login/logout loading\-spinner gap (from Phase 0).
- [ ] Build or extend the "Espace Simulation" entry point \+ 4\-type picker (per Phase 0 finding).
- [ ] Build or extend the "Expression Orale" exercise list (reusing Écrite's pattern, per Phase 0).
- [ ] Build the recording UI: `MediaRecorder` hook, mic\-permission handling, `audio/webm;codecs=opus` with `audio/mp4` fallback for Safari/iOS, one\-shot lock (no re\-record once stopped).
- [ ] Build or reuse the per\-task countdown timer: Task 1 \= 2 min, Task 2 \= 2 min, Task 3 \= 3 min, enforced client\-side.
- [ ] Wire the submit action: upload audio to Supabase Storage via signed URL → trigger the async evaluation job (`/api/evaluate-oral`).
- [ ] Implement the STT call inside the async job — `gpt-4o-mini-transcribe`, per the tested \~1.7 FCFA/task cost in the feasibility doc.
- [ ] Implement the LLM scoring call against `OralDiagnosticReportSchema` \+ a new oral rubric prompt.
- [ ] Wire the result into the existing PDF\-correction pipeline (Phase 0 contract), feeding oral\-specific score/feedback content — do not rebuild this pipeline.
- [ ] Call `verify_and_consume_quota(user_id)` at attempt start, unmodified (per Phase 0 confirmation).

## Phase 3 — Storage, retention, cost controls {#phase-3-storage-retention-cost-controls}

- [ ] Configure the Supabase Storage bucket \+ signed\-URL policy for oral audio (private bucket, short TTL).
- [ ] Implement retention: keep audio long\-term (confirmed decision); add a lifecycle rule moving older recordings to a cheaper cold/archive storage tier.
- [ ] Add plain\-language disclosure to Terms/Privacy Policy that audio may be used to improve/train AI models — confirm exact wording with someone familiar with the relevant privacy rules; not something to draft from this document alone.
- [ ] Add basic per\-attempt cost logging (STT \+ LLM spend) so real costs can be checked against the Section 3 FCFA estimates in the feasibility doc over time.

## Phase 4 — Blocked on your decision (do not build yet) {#phase-4-blocked-on-your-decision-do-not-build-yet}

These need an explicit answer from you before implementation — building ahead of a decision here risks throwing work away.

- [ ] **Dispute/appeal feature:** still undecided (open question from the last review round) — should students get a "contest my score" action, should it be informal/manual only, or dropped entirely? Nothing here should be built until this is answered.
- [ ] **Admin override/regrade:** only relevant if the dispute feature is built — is the AI score final, or can admin manually adjust it?
- [ ] **Audit logging for admin access to raw student audio:** should every time an admin opens a student's recording be logged?
- [ ] **Pipeline failure handling under one\-shot policy:** if STT or LLM scoring fails mid\-attempt, does the student get a one\-time exception re\-attempt, or does it go to admin review? This one **should** be resolved before Phase 2 is considered done, since it's a gap in the one\-shot flow itself, not a nice\-to\-have.
- [ ] **Budget ceiling per submission:** still open — determines whether Phase\-2\-and\-beyond pronunciation scoring (Speechace/SpeechSuper) is worth pursuing at all.

## Phase 5 — QA & polish {#phase-5-qa-polish}

- [ ] Noise/quality warning to the student when mic input is weak or silent.
- [ ] Cross\-browser/device recording test pass, especially the Safari/iOS fallback path from Phase 2.
- [ ] Confirm async job failure/retry behavior under real network conditions, not just happy path.
- [ ] Full run\-through against the sequence diagram to confirm the shipped flow actually matches it.

## Final verification gate {#final-verification-gate}

- [ ] Every "Confirm" row from the feasibility doc's Reuse\-vs\-New table has been resolved with evidence from the live codebase — not left as an assumption.
- [ ] Spot\-check that nothing was rebuilt that already existed (cross\-reference against Phase 0 findings).
- [ ] One\-shot enforcement verified end\-to\-end — confirm a completed task genuinely cannot be re\-recorded or resubmitted.
- [ ] Real per\-attempt cost (STT \+ LLM, from Phase 3 logging) checked against the Section 3 estimates in the feasibility doc.
- [ ] Retention/cold\-storage tiering rule is actually running, not just documented.
