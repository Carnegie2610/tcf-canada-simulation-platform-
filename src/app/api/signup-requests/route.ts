import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SignupRequestSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
  desired_plan_ee: z.string().max(50).nullable().optional(),
  desired_plan_eo: z.string().max(50).nullable().optional(),
});

/**
 * Public endpoint — no auth. Uses the service-role client so the insert doesn't
 * depend on anon-key RLS, while the Zod schema above is what actually constrains
 * what can be written (the caller can only ever create a 'pending' row; status and
 * reviewer fields are never taken from the request body).
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = SignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();

  // Don't let someone spam the queue with the same address, and give a clear
  // answer to anyone who simply forgot they'd already applied.
  const { data: existing } = await admin
    .from("signup_requests")
    .select("id, status")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_pending" }, { status: 409 });
  }

  const { error } = await admin.from("signup_requests").insert({
    full_name: parsed.data.full_name.trim(),
    email,
    phone: parsed.data.phone?.trim() || null,
    message: parsed.data.message?.trim() || null,
    desired_plan_ee: parsed.data.desired_plan_ee || null,
    desired_plan_eo: parsed.data.desired_plan_eo || null,
  });

  if (error) {
    console.error("[signup-requests] insert failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
