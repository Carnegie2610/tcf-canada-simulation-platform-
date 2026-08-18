export interface PlanMeta {
  label: string;
  price: number;
  commission: number;
  eeQuota: number;
  eoQuota: number;
  days: number;
  skillType: "ee" | "eo" | "mix";
}

// Expression Écrite only — standard plans (shown to every admin creating a student).
export const PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_5000:  { label: "Forfait Découverte", price: 5000,  commission: 1750,  eeQuota: 40, eoQuota: 0, days: 30, skillType: "ee" },
  PLAN_10000: { label: "Forfait Standard",   price: 10000, commission: 3500,  eeQuota: 80, eoQuota: 0, days: 60, skillType: "ee" },
  PLAN_30000: { label: "Forfait Excellence", price: 30000, commission: 10500, eeQuota: 40, eoQuota: 0, days: 30, skillType: "ee" },
};

// Expression Écrite only — smaller admin-only plans, only offered at creation time.
export const ADMIN_ONLY_PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_2000: { label: "Forfait Essentiel",     price: 2000, commission: 700,  eeQuota: 10, eoQuota: 0, days: 30, skillType: "ee" },
  PLAN_3000: { label: "Forfait Intermédiaire", price: 3000, commission: 1050, eeQuota: 20, eoQuota: 0, days: 30, skillType: "ee" },
};

// Expression Orale only — commission is a flat 30% of price (vs EE's flat 35%).
export const EO_PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_EO_2000:  { label: "Forfait Oral Essentiel",     price: 2000,  commission: 600,  eeQuota: 0, eoQuota: 10, days: 30, skillType: "eo" },
  PLAN_EO_3000:  { label: "Forfait Oral Intermédiaire", price: 3000,  commission: 900,  eeQuota: 0, eoQuota: 15, days: 30, skillType: "eo" },
  PLAN_EO_5000:  { label: "Forfait Oral Découverte",    price: 5000,  commission: 1500, eeQuota: 0, eoQuota: 25, days: 30, skillType: "eo" },
  PLAN_EO_10000: { label: "Forfait Oral Standard",      price: 10000, commission: 3000, eeQuota: 0, eoQuota: 50, days: 60, skillType: "eo" },
};

// EE + EO combined, quotas chosen independently per skill by the student.
// Commission is a placeholder 35% (same rate as EE) until a final rate is confirmed.
export const MIX_PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_MIX_4000:  { label: "Forfait Mix Essentiel",     price: 4000,  commission: 1400, eeQuota: 10, eoQuota: 10, days: 30, skillType: "mix" },
  PLAN_MIX_5000:  { label: "Forfait Mix Intermédiaire", price: 5000,  commission: 1750, eeQuota: 20, eoQuota: 15, days: 30, skillType: "mix" },
  PLAN_MIX_10000: { label: "Forfait Mix Standard",      price: 10000, commission: 3500, eeQuota: 40, eoQuota: 25, days: 30, skillType: "mix" },
  PLAN_MIX_20000: { label: "Forfait Mix Excellence",    price: 20000, commission: 7000, eeQuota: 80, eoQuota: 50, days: 60, skillType: "mix" },
};

export const ALL_PLAN_CONFIGS = [PLAN_CONFIG, ADMIN_ONLY_PLAN_CONFIG, EO_PLAN_CONFIG, MIX_PLAN_CONFIG];

export function getPlanMeta(key: string): PlanMeta {
  for (const config of ALL_PLAN_CONFIGS) {
    if (key in config) return config[key];
  }
  return { label: key, price: 0, commission: 0, eeQuota: 0, eoQuota: 0, days: 0, skillType: "ee" };
}
