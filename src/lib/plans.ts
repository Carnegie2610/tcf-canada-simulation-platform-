export interface PlanMeta {
  label: string;
  price: number;
  commission: number;
  quota: number;
  days: number;
}

export const PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_5000:  { label: "Forfait Découverte", price: 5000,  commission: 1750,  quota: 40, days: 30 },
  PLAN_10000: { label: "Forfait Standard",   price: 10000, commission: 3500,  quota: 80, days: 60 },
  PLAN_30000: { label: "Forfait Excellence", price: 30000, commission: 10500, quota: 40, days: 30 },
};

export function getPlanMeta(key: string): PlanMeta {
  return PLAN_CONFIG[key] ?? { label: key, price: 0, commission: 0, quota: 0, days: 0 };
}
