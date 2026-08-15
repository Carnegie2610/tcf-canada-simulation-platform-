import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient(options?: { persistSession?: boolean }) {
  const cookieStore = await cookies();
  const persistSession = options?.persistSession ?? true;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              // "Remember me" unchecked: strip maxAge/expires so the auth cookie
              // becomes a browser-session cookie instead of surviving a restart.
              const finalOptions = persistSession
                ? cookieOptions
                : { ...cookieOptions, maxAge: undefined, expires: undefined };
              cookieStore.set(name, value, finalOptions);
            });
          } catch {
            // Called from a Server Component render — middleware (proxy.ts)
            // already refreshes the session on every request, so this is safe to ignore.
          }
        },
      },
    }
  );
}
