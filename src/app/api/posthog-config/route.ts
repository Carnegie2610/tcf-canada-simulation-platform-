import { NextResponse } from "next/server";

/**
 * Hands the PostHog client-side config to the browser at runtime. Note this
 * doesn't make the key any less visible than a NEXT_PUBLIC_ variable would —
 * PostHog's project key has to reach the browser either way for client-side
 * tracking to work at all — it just avoids Next.js's build-time inlining of
 * NEXT_PUBLIC_-prefixed variables, per an explicit choice to keep the env var
 * names without that prefix.
 */
export async function GET() {
  const key = process.env.POSTHOG_KEY ?? null;
  const host = process.env.POSTHOG_HOST || "https://eu.i.posthog.com";

  return NextResponse.json({ key, host });
}
