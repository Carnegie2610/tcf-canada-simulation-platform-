"use client";

import { Badge } from "@/components/atoms/Badge";

export interface PricingCardProps {
  name: string;
  price: string;
  currency: string;
  description: string;
  features: string[];
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
  description,
  features,
  buttonLabel,
  isHighlighted = false,
}: PricingCardProps) {
  function handlePlanSelection() {
    const phoneNumber = "237697443878";
    const message = encodeURIComponent(
      `Bonjour OBJECTIF 4C2, je souhaite souscrire au *${name}* (${price} F CFA) pour commencer mes simulations d'expression écrite du TCF Canada. Veuillez m'indiquer la procédure d'activation.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] ${
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
        <p className="mt-1 text-sm text-[--slate-400]">{description}</p>
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
        <button
          onClick={handlePlanSelection}
          className={`w-full justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isHighlighted
              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30"
              : "border border-[--slate-700] bg-[--slate-800] text-[--slate-200] hover:bg-[--slate-700]"
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
