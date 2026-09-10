import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_MAX_PER_HOUR = 3;

const PublicSubmitSchema = z.object({
  name: z.string().min(2).max(255),
  role_text: z.string().max(255).optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(5).max(2000),
  // Honeypot: a field real visitors never see (hidden via CSS) or fill in.
  // Bots that blindly fill every input in the raw HTML populate it — if it's
  // non-empty, silently pretend success without writing anything.
  website: z.string().max(255).optional(),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * Fully public endpoint — no auth, same reasoning as signup-requests/route.ts:
 * the service-role client bypasses RLS entirely, so what a caller can write is
 * constrained only by the Zod schema and the checks below (never trust status,
 * user_id, or submitter_ip from the request body — they're always set here).
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = PublicSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (parsed.data.website) {
    // Looks like success to whatever filled the honeypot; nothing is written.
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const admin = createSupabaseAdminClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("submitter_ip", ip)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT_MAX_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { error } = await admin.from("testimonials").insert({
    name: parsed.data.name.trim(),
    role_text: parsed.data.role_text?.trim() || null,
    rating: parsed.data.rating,
    content: parsed.data.content.trim(),
    status: "pending",
    user_id: null,
    avatar_path: null,
    submitter_ip: ip,
  });

  if (error) {
    console.error("[testimonials/submit] insert failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
