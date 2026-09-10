import posthog from "posthog-js";

let initPromise: Promise<typeof posthog | null> | null = null;

/**
 * POSTHOG_KEY/POSTHOG_HOST are deliberately not NEXT_PUBLIC_-prefixed, so
 * Next.js won't inline them into the client bundle — this fetches them from
 * a small server route instead. The value still reaches the browser either
 * way (client-side PostHog can't work otherwise), so this is a naming choice,
 * not a security boundary.
 *
 * Cached in a module-level promise so repeated calls (e.g. once per pageview
 * from the provider) reuse the same in-flight/completed fetch + init rather
 * than re-fetching config or calling posthog.init() more than once.
 */
export function initPostHog(): Promise<typeof posthog | null> {
  if (!initPromise) {
    initPromise = fetch("/api/posthog-config")
      .then((res) => res.json())
      .then((config: { key: string | null; host: string }) => {
        if (!config.key) return null; // Not configured — no-op.
        posthog.init(config.key, {
          api_host: config.host,
          capture_pageview: false,
          person_profiles: "identified_only",
          session_recording: {},
        });
        return posthog;
      })
      .catch(() => null);
  }
  return initPromise;
}

/** Fire-and-forget capture — waits for init (queued if it hasn't finished
 * yet) without making every call site deal with the async dance itself. */
export function capture(event: string, properties?: Record<string, unknown>) {
  void initPostHog().then((client) => client?.capture(event, properties));
}

/** Same idea as `capture`, for tagging the current visitor as a known person. */
export function identify(id: string, properties?: Record<string, unknown>) {
  void initPostHog().then((client) => client?.identify(id, properties));
}

export { posthog };
