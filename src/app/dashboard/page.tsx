import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardQuadrantGrid } from "@/components/organisms/student/DashboardQuadrantGrid";
import {
  ConsistencyTracker,
  type ActivityDay,
} from "@/components/organisms/student/ConsistencyTracker";

// Day labels Mon–Sun (fr)
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekStart(): Date {
  const today = new Date();
  // ISO week starts Monday (day 1). Sunday = 0 → shift to 6.
  const dow = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - dow);
  return monday;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function computeActivityData(
  comboSubs: Array<{
    created_at: string;
    is_completed: boolean;
    draft_task_1: string;
    draft_task_2: string;
    draft_task_3: string;
  }> | null,
  regularSubs: Array<{ created_at: string; is_completed: boolean }> | null
): { activityDays: ActivityDay[]; currentStreak: number; totalCompleted: number } {
  const combos = comboSubs ?? [];
  const regulars = regularSubs ?? [];

  // Total completed simulations (both types)
  const totalCompleted =
    combos.filter((s) => s.is_completed).length +
    regulars.filter((s) => s.is_completed).length;

  // Build a date → task level map
  const dayMap = new Map<string, 0 | 1 | 2 | 3>();

  const bump = (dateKey: string, level: 0 | 1 | 2 | 3) => {
    const cur = dayMap.get(dateKey) ?? 0;
    if (level > cur) dayMap.set(dateKey, level);
  };

  for (const s of combos) {
    const key = toDateKey(new Date(s.created_at));
    if (s.is_completed) {
      bump(key, 3);
    } else {
      const nonEmpty = [s.draft_task_1, s.draft_task_2, s.draft_task_3].filter(
        (d) => d && d.trim().length > 0
      ).length;
      bump(key, Math.min(nonEmpty, 2) as 0 | 1 | 2);
    }
  }

  for (const s of regulars) {
    if (s.is_completed) {
      const key = toDateKey(new Date(s.created_at));
      bump(key, 1);
    }
  }

  // Build current-week activity days (Mon–Sun)
  const weekStart = getWeekStart();
  const activityDays: ActivityDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toDateKey(d);
    return { dayLabel: DAY_LABELS[i], taskLevel: dayMap.get(key) ?? 0 };
  });

  // Streak: spec algorithm — count backwards from today stopping at first gap
  const allActiveDates = new Set(dayMap.keys());
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const check = new Date();
    check.setDate(check.getDate() - i);
    check.setHours(0, 0, 0, 0);
    if (allActiveDates.has(toDateKey(check))) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { activityDays, currentStreak, totalCompleted };
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: comboSubs },
    { data: regularSubs },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, ee_simulations_quota, ee_simulations_remaining, eo_simulations_quota, eo_simulations_remaining")
      .eq("id", user.id)
      .single(),
    supabase
      .from("combination_submissions")
      .select("created_at, is_completed, draft_task_1, draft_task_2, draft_task_3")
      .eq("user_id", user.id),
    supabase
      .from("submissions")
      .select("created_at, is_completed")
      .eq("user_id", user.id),
  ]);

  const quotaTotal = (profile?.ee_simulations_quota ?? 0) + (profile?.eo_simulations_quota ?? 0);
  const quotaRemaining = (profile?.ee_simulations_remaining ?? 0) + (profile?.eo_simulations_remaining ?? 0);
  const simulationsUsed = quotaTotal - quotaRemaining;
  const simulationsTotal = quotaTotal;
  const firstName = profile?.full_name?.split(" ")[0] ?? "là";

  const { activityDays, currentStreak, totalCompleted } = computeActivityData(
    comboSubs,
    regularSubs
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-white)]">
          Bienvenue, {firstName}&nbsp;!
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Votre préparation pour l&apos;immigration canadienne (TCF&nbsp;/&nbsp;TEF Canada)
        </p>
      </div>

      <ConsistencyTracker
        activityDays={activityDays}
        currentStreak={currentStreak}
        totalCompleted={totalCompleted}
      />

      <DashboardQuadrantGrid
        simulationsUsed={simulationsUsed}
        simulationsTotal={simulationsTotal}
      />
    </div>
  );
}
