"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog } from "@/lib/posthog";

/**
 * App Router client-side navigations don't fire a real page load, so
 * posthog-js's own pageview autocapture never sees them — this fires a
 * manual $pageview on every path/query change instead. Wrapped in its own
 * component (not the outer one) because useSearchParams requires a
 * Suspense boundary.
 */
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Idempotent — guards against child effects (this one) firing before the
    // parent's init effect on initial mount, per React's bottom-up effect order.
    const client = initPostHog();
    if (!client) return;
    const search = searchParams.toString();
    client.capture("$pageview", {
      $current_url: search ? `${pathname}?${search}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogAnalytics() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <Suspense fallback={null}>
      <PostHogPageview />
    </Suspense>
  );
}
