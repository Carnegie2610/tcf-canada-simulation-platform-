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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Identifiants incorrects ou compte suspendu.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .single();

    if (profile?.role === "admin" || profile?.role === "super_admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <AuthPageTemplate>
      <AuthForm onSubmit={handleSignIn} loading={loading} error={error} />
    </AuthPageTemplate>
  );
}
