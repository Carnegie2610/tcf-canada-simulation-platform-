"use client";

import { Badge } from "@/components/atoms/Badge";

export interface PricingCardProps {
  name: string;
  price: string;
  currency: string;
  description: string;
  features: string[];
  buttonLabel: string;
  duration: string;
  isHighlighted?: boolean;
  isSecondary?: boolean;
  badge?: string;
  accent?: "purple" | "amber";
}

const CheckIcon = () => (
  <svg
    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

// Features prefixed with "★ " get highlighted styling
const HIGHLIGHT_PREFIX = "★ ";

export function PricingCard({
  name,
  price,
  currency,
  description,
  features,
  buttonLabel,
  duration,
  isHighlighted = false,
  isSecondary = false,
  badge,
  accent,
}: PricingCardProps) {
  function handlePlanSelection() {
    const phoneNumber = "237697443878";
    const message = encodeURIComponent(
      `Bonjour OBJECTIF 4C2, je souhaite souscrire au *${name}* (${price} F CFA) pour commencer mes simulations d'expression écrite du TCF Canada. Veuillez m'indiquer la procédure d'activation.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  }

  const cardClass = isHighlighted
    ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-[--slate-900]"
    : isSecondary
    ? "border-emerald-500/50 shadow-emerald-500/10 bg-[--slate-900]"
    : accent === "purple"
    ? "border-purple-500/50 shadow-purple-500/10 bg-[--slate-900]"
    : accent === "amber"
    ? "border-amber-500/50 shadow-amber-500/10 bg-[--slate-900]"
    : "border-[--slate-800] bg-[--slate-900]";

  const buttonClass = isHighlighted
    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30"
    : isSecondary
    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
    : accent === "purple"
    ? "bg-purple-600 hover:bg-purple-500 text-white"
    : accent === "amber"
    ? "bg-amber-600 hover:bg-amber-500 text-white"
    : "border border-[--slate-700] bg-[--slate-800] text-[--slate-200] hover:bg-[--slate-700]";

  const durationPillClass = isHighlighted
    ? "bg-blue-500/10 text-[--accent-blue-text] ring-1 ring-blue-500/30"
    : isSecondary
    ? "bg-emerald-500/10 text-[--accent-emerald-text] ring-1 ring-emerald-500/30"
    : accent === "purple"
    ? "bg-purple-500/10 text-[--accent-purple-text] ring-1 ring-purple-500/30"
    : accent === "amber"
    ? "bg-amber-500/10 text-[--accent-amber-text] ring-1 ring-amber-500/30"
    : "bg-[--slate-800] text-[--slate-400] ring-1 ring-[--slate-700]";

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] ${cardClass}`}
    >
      {/* Badge rendered inside card so the border doesn't overlap it */}
      {isHighlighted && (
        <div className="mb-4 flex justify-center">
          <Badge label="🏆 Recommandé" variant="recommended" />
        </div>
      )}

      {badge && !isHighlighted && (
        <div className="mb-4 flex justify-center">
          <span className="whitespace-nowrap rounded-full bg-emerald-900/80 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
            {badge}
          </span>
        </div>
      )}

      <h3 className="font-(family-name:--font-sora) text-lg font-bold text-[--slate-200]">
        {name}
      </h3>

      <div className="secure-canvas-wrapper mt-5">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <p className="whitespace-nowrap text-3xl font-black text-[--slate-200] xl:text-4xl">
            {price}{" "}
            <span className="text-sm font-normal text-[--slate-400]">{currency}</span>
          </p>
          <span className={`mb-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${durationPillClass}`}>
            ⏱ {duration}
          </span>
        </div>
        <p className="mt-1 text-sm text-[--slate-400]">{description}</p>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => {
          const isStarred = feature.startsWith(HIGHLIGHT_PREFIX);
          const label = isStarred ? feature.slice(HIGHLIGHT_PREFIX.length) : feature;
          return (
            <li
              key={feature}
              className={`flex items-start gap-2 text-sm ${isStarred ? "font-semibold text-[--slate-200]" : "text-[--slate-400]"}`}
            >
              <CheckIcon />
              {label}
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <button
          onClick={handlePlanSelection}
          className={`w-full justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
