export interface PlanMeta {
  label: string;
  price: number;
  commission: number;
  quota: number;
  days: number;
}

export const PLAN_CONFIG: Record<string, PlanMeta> = {
  PLAN_2000:  { label: "Plan Starter",      price: 2000,  commission: 700,  quota: 10,  days: 15  },
  PLAN_3000:  { label: "Plan Essentiel",    price: 3000,  commission: 1050, quota: 20,  days: 20  },
  PLAN_5000:  { label: "Plan de Base",      price: 5000,  commission: 1750, quota: 40,  days: 30  },
  PLAN_10000: { label: "Plan Pro / Premium",price: 10000, commission: 3500, quota: 80,  days: 60  },
  PLAN_15000: { label: "Plan Élite / VIP",  price: 15000, commission: 5250, quota: 120, days: 90  },
  PLAN_20000: { label: "Plan Elite",        price: 20000, commission: 7000, quota: 160, days: 120 },
};

export function getPlanMeta(key: string): PlanMeta {
  return PLAN_CONFIG[key] ?? { label: key, price: 0, commission: 0, quota: 0, days: 0 };
}
