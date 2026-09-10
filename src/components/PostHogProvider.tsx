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
    let cancelled = false;

    void initPostHog().then((client) => {
      if (!client || cancelled) return;
      const search = searchParams.toString();
      client.capture("$pageview", {
        $current_url: search ? `${pathname}?${search}` : pathname,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}

export function PostHogAnalytics() {
  useEffect(() => {
    void initPostHog();
  }, []);

  return (
    <Suspense fallback={null}>
      <PostHogPageview />
    </Suspense>
  );
}
