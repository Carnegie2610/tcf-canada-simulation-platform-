"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--slate-500)] hover:bg-[var(--slate-800)] hover:text-[var(--slate-300)] transition-colors"
    >
      Se déconnecter
    </button>
  );
}
