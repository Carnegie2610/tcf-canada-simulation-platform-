"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPageTemplate } from "@/components/templates/AuthPageTemplate";
import { AuthForm } from "@/components/molecules/AuthForm";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(email: string, password: string) {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        setError("Identifiants incorrects ou compte suspendu.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageTemplate>
      <AuthForm onSubmit={handleSignIn} loading={loading} error={error} />
    </AuthPageTemplate>
  );
}
