import Link from "next/link";
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[--brand-red] hover:bg-red-600 text-white shadow-lg shadow-red-900/30",
  secondary: "bg-[--slate-800] hover:bg-[--slate-700] text-[--slate-200] border border-[--slate-700]",
  ghost: "text-[--slate-300] hover:text-[--slate-200]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-8 py-4 text-base rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-red] disabled:opacity-50 cursor-pointer";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  href,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = loading ? (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Connexion en cours...
    </span>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
