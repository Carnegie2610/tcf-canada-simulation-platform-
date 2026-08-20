import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Raw evaluation data for one submission, in the exact shape the student-facing
 * PDF components expect.
 *
 * Needed because the admin audit view only ever holds a *normalised* copy of a
 * result: scores rescaled to /100, the three task evaluations collapsed into
 * grammar/lexical/coherence, corrections flattened into one array. That mapping
 * is lossy and one-way, so the PDF can't be rebuilt from it — the original row
 * has to be fetched.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const type = request.nextUrl.searchParams.get("type");
  if (type !== "combination" && type !== "oral") {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  if (type === "combination") {
    const { data: sub } = await supabase
      .from("combination_submissions")
      .select(
        `id, user_id, word_count_1, word_count_2, word_count_3,
         combination:combinations ( title, exam_type ),
         evaluation:combination_evaluations (
           global_score, cefr_level, appreciation,
           task_1_evaluation, task_2_evaluation, task_3_evaluation, created_at
         ),
         profile:profiles ( full_name, email )`
      )
      .eq("id", id)
      .single();

    const row = sub as Record<string, unknown> | null;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const combo = pickOne(row.combination);
    const evaluation = pickOne(row.evaluation);
    const student = pickOne(row.profile);
    if (!evaluation) return NextResponse.json({ error: "not_evaluated" }, { status: 409 });

    return NextResponse.json({
      kind: "combination",
      combinationTitle: combo?.title ?? "Combinaison",
      examType: combo?.exam_type ?? "TCF",
      globalScore: evaluation.global_score,
      cefrLevel: evaluation.cefr_level,
      appreciation: evaluation.appreciation,
      task1: evaluation.task_1_evaluation,
      task2: evaluation.task_2_evaluation,
      task3: evaluation.task_3_evaluation,
      wordCount1: row.word_count_1 ?? 0,
      wordCount2: row.word_count_2 ?? 0,
      wordCount3: row.word_count_3 ?? 0,
      createdAt: evaluation.created_at,
      studentName: student?.full_name ?? student?.email ?? "",
    });
  }

  const { data: sub } = await supabase
    .from("oral_submissions")
    .select(
      `id, user_id,
       combination:oral_combinations ( title, exam_type, tasks ),
       evaluation:oral_evaluations (
         global_score, cefr_level, appreciation,
         task_1_evaluation, task_2_evaluation, task_3_evaluation, created_at
       ),
       profile:profiles ( full_name, email )`
    )
    .eq("id", id)
    .single();

  const row = sub as Record<string, unknown> | null;
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const combo = pickOne(row.combination);
  const evaluation = pickOne(row.evaluation);
  const student = pickOne(row.profile);
  if (!evaluation) return NextResponse.json({ error: "not_evaluated" }, { status: 409 });

  const tasks = (combo?.tasks ?? {}) as Record<string, { speakingTimeSeconds?: number }>;

  return NextResponse.json({
    kind: "oral",
    oralCombinationTitle: combo?.title ?? "Combinaison orale",
    examType: combo?.exam_type ?? "TCF",
    globalScore: evaluation.global_score,
    cefrLevel: evaluation.cefr_level,
    appreciation: evaluation.appreciation,
    task1: evaluation.task_1_evaluation,
    task2: evaluation.task_2_evaluation,
    task3: evaluation.task_3_evaluation,
    speakingDurationSeconds1: tasks.tache_1?.speakingTimeSeconds ?? 0,
    speakingDurationSeconds2: tasks.tache_2?.speakingTimeSeconds ?? 0,
    speakingDurationSeconds3: tasks.tache_3?.speakingTimeSeconds ?? 0,
    createdAt: evaluation.created_at,
    studentName: student?.full_name ?? student?.email ?? "",
  });
}

/** PostgREST returns embedded rows as an array or an object depending on the join. */
function pickOne(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}
