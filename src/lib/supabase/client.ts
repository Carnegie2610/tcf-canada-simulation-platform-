"use client";

import { createBrowserClient } from "@supabase/ssr";

const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function createSupabaseBrowserClient(options?: { persistSession?: boolean }) {
  const persistSession = options?.persistSession ?? true;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // "Remember me" unchecked: omit maxAge so the auth cookie is a
        // browser-session cookie instead of surviving a restart.
        maxAge: persistSession ? REMEMBER_ME_MAX_AGE_SECONDS : undefined,
      },
    }
  );
}
