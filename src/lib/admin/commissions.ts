import { getPlanMeta } from "@/lib/plans";

/**
 * Commission split rates. The "principal" share is already stored per-payment by
 * createUser() (via each plan's own `commission`); the "secondary" share is derived
 * from revenue here, so these two constants are the single source of truth for the
 * dashboard rather than magic numbers scattered across the SSR page and API route.
 */
export const EE_SECONDARY_RATE = 0.65;
export const EO_SECONDARY_RATE = 0.7;

export interface LedgerPaymentRow {
  id: string;
  user_id: string;
  created_at: string;
  student_name: string;
  student_email: string;
  plan: string;
  plan_price: number;
  commission: number;
}

export interface LedgerEntry {
  id: string;
  created_at: string;
  student_name: string;
  student_email: string;
  /** One label per pack bought in the same transaction (e.g. an EE and an EO pack). */
  plan_labels: string[];
  plan_price: number;
  commission: number;
}

/**
 * Collapses the separate EE and EO `payments` rows a single sign-up produces into
 * one ledger entry, so a student isn't listed twice for what was one transaction.
 *
 * Grouped by student *and* minute rather than student alone: two packs bought in the
 * same sign-up share a timestamp and belong together, while a genuine repeat purchase
 * weeks later stays its own line so the history isn't flattened.
 */
export function groupLedgerRows(rows: LedgerPaymentRow[]): LedgerEntry[] {
  const groups = new Map<string, LedgerEntry>();

  for (const row of rows) {
    // Minute precision: rows inserted by the same createUser() call collapse together.
    const key = `${row.user_id ?? row.student_email}|${(row.created_at ?? "").slice(0, 16)}`;
    const existing = groups.get(key);
    const label = getPlanMeta(row.plan).label;

    if (existing) {
      if (!existing.plan_labels.includes(label)) existing.plan_labels.push(label);
      existing.plan_price += Number(row.plan_price);
      existing.commission += Number(row.commission);
      // Keep the earliest id/date stable so React keys don't churn between refetches.
      if (row.created_at < existing.created_at) existing.created_at = row.created_at;
    } else {
      groups.set(key, {
        id: row.id,
        created_at: row.created_at,
        student_name: row.student_name,
        student_email: row.student_email,
        plan_labels: [label],
        plan_price: Number(row.plan_price),
        commission: Number(row.commission),
      });
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
