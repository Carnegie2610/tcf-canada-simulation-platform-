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

  async function handleForgotPassword(email: string): Promise<string | null> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return error ? "Aucun compte trouvé pour cette adresse ou erreur réseau." : null;
  }

  async function handleSignIn(email: string, password: string, rememberMe: boolean) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const json = (await res.json()) as {
        requiresOtp?: boolean;
        email?: string;
        role?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "Identifiants incorrects ou compte suspendu.");
        return;
      }

      if (json.requiresOtp) {
        router.push(
          `/login/verify-otp?email=${encodeURIComponent(json.email ?? email)}&remember=${rememberMe ? "1" : "0"}`
        );
        return;
      }

      if (json.role === "admin" || json.role === "super_admin") {
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
      <AuthForm
        onSubmit={handleSignIn}
        loading={loading}
        error={error}
        onForgotPassword={handleForgotPassword}
      />
    </AuthPageTemplate>
  );
}
