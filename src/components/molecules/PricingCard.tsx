import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";

export interface PricingCardProps {
  name: string;
  price: string;
  currency: string;
  duration: string;
  quota: string;
  hasAiCorrection: boolean;
  buttonLabel: string;
  isHighlighted?: boolean;
}

const CheckIcon = () => (
  <svg
    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

export function PricingCard({
  name,
  price,
  currency,
  duration,
  quota,
  hasAiCorrection,
  buttonLabel,
  isHighlighted = false,
}: PricingCardProps) {
  const features = [
    quota,
    "Accès Sections A et B",
    "Tableau de bord de progression",
    ...(hasAiCorrection
      ? ["Corrections IA avec scores CECRL", "Réponses modèles niveau C2"]
      : []),
  ];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
        isHighlighted
          ? "border-[--blue-500] shadow-xl shadow-blue-500/10"
          : "border-[--slate-800] bg-[--slate-900]"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge label="Recommandé" variant="recommended" />
        </div>
      )}

      <h3 className="font-(family-name:--font-sora) text-lg font-bold text-white">
        {name}
      </h3>

      <div className="secure-canvas-wrapper mt-5">
        <p className="text-4xl font-black text-white">
          {price}{" "}
          <span className="text-sm font-normal text-[--slate-400]">{currency}</span>
        </p>
        <p className="mt-1 text-sm text-[--slate-400]">{duration}</p>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[--slate-400]">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          variant={isHighlighted ? "primary" : "secondary"}
          href="/login"
          className="w-full justify-center"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
