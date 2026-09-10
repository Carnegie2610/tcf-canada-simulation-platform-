import posthog from "posthog-js";

let initialized = false;

/**
 * Idempotent init — the provider component's effect can legitimately re-run
 * (e.g. React strict-mode double-invoke in dev), and posthog-js itself warns
 * if init() is called twice, so this guards it explicitly rather than relying
 * on the library to dedupe silently.
 */
export function initPostHog(): typeof posthog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null; // Not configured (e.g. local dev without a key) — no-op.

  if (!initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      // Pageviews are captured manually in the provider (App Router doesn't
      // fire a real navigation event posthog-js can hook into automatically),
      // autocapture still covers clicks/inputs.
      capture_pageview: false,
      person_profiles: "identified_only",
    });
    initialized = true;
  }
  return posthog;
}

export { posthog };
