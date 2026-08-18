import Link from "next/link";
import { AdminTableCell } from "@/components/atoms/AdminTableCell";
import type { AdminProfile } from "@/lib/admin/types";
import { getPlanMeta } from "@/lib/plans";

interface StudentResultRowProps {
  profile: AdminProfile;
}

export function StudentResultRow({ profile }: StudentResultRowProps) {
  const isExpired = profile.expires_at
    ? new Date(profile.expires_at) < new Date()
    : false;

  return (
    <tr className="border-t border-[var(--slate-700)] hover:bg-[var(--slate-800)]/50 transition-colors">
      <AdminTableCell>
        <span className="font-medium text-[var(--brand-white)]">
          {profile.full_name}
        </span>
      </AdminTableCell>
      <AdminTableCell>{profile.email}</AdminTableCell>
      <AdminTableCell>
        <span className="flex flex-col gap-0.5">
          <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs font-medium w-fit">
            {profile.assigned_plan_ee ? getPlanMeta(profile.assigned_plan_ee).label : "EE : —"}
          </span>
          <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs font-medium w-fit">
            {profile.assigned_plan_eo ? getPlanMeta(profile.assigned_plan_eo).label : "EO : —"}
          </span>
        </span>
      </AdminTableCell>
      <AdminTableCell>
        {profile.ee_simulations_quota == null && profile.eo_simulations_quota == null ? (
          "—"
        ) : (
          <span className="space-x-2">
            <span className={profile.ee_simulations_remaining === 0 ? "text-red-400" : ""}>
              EE {profile.ee_simulations_remaining}/{profile.ee_simulations_quota}
            </span>
            <span className={profile.eo_simulations_remaining === 0 ? "text-red-400" : ""}>
              EO {profile.eo_simulations_remaining}/{profile.eo_simulations_quota}
            </span>
          </span>
        )}
      </AdminTableCell>
      <AdminTableCell>
        {profile.cohort_tag ? (
          <span className="rounded bg-[var(--blue-600)]/20 px-2 py-0.5 text-xs text-[var(--blue-500)]">
            {profile.cohort_tag}
          </span>
        ) : (
          <span className="text-[var(--slate-500)]">—</span>
        )}
      </AdminTableCell>
      <AdminTableCell>
        <span
          className={`text-xs ${isExpired ? "text-red-400" : "text-[var(--slate-400)]"}`}
        >
          {profile.expires_at
            ? new Date(profile.expires_at).toLocaleDateString("fr-CA")
            : "—"}
        </span>
      </AdminTableCell>
      <AdminTableCell align="right">
        <Link
          href={`/admin/audit/${profile.id}`}
          className="rounded-lg bg-[var(--blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--blue-500)] transition-colors"
        >
          Auditer
        </Link>
      </AdminTableCell>
    </tr>
  );
}
