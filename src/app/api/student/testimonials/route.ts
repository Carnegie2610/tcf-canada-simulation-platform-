import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SubmitTestimonialSchema = z.object({
  name: z.string().min(2).max(255),
  role_text: z.string().max(255).optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(5).max(2000),
  avatar_path: z.string().max(512).nullable().optional(),
});

/**
 * A student submits their own testimonial via the dashboard. Uses the normal
 * RLS-scoped server client (not the service-role admin client) — the
 * "Students submit own pending testimonial" policy is what actually
 * constrains this to `user_id = auth.uid()` and `status = 'pending'`, so
 * there's nothing here a student could tamper with client-side to bypass
 * moderation.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = SubmitTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("testimonials")
    .insert({ ...parsed.data, user_id: user.id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
