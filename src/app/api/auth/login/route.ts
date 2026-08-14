import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Centralizes login so a super_admin's session can be torn down again in this same
// response, before it ever reaches the browser — a Server Component can't write
// cookies at all, so this Route Handler is the only place that can both verify the
// password and guarantee no session leaks out ahead of the OTP step.
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "Identifiants incorrects ou compte suspendu." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role === "super_admin") {
    // Revoke the session just issued by signInWithPassword before this response is
    // sent — the browser must never receive a usable cookie until the OTP is verified.
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      return NextResponse.json(
        { error: "Échec de l'envoi du code de vérification. Réessayez." },
        { status: 500 }
      );
    }

    return NextResponse.json({ requiresOtp: true, email });
  }

  return NextResponse.json({ requiresOtp: false, role: profile?.role ?? "student" });
}
