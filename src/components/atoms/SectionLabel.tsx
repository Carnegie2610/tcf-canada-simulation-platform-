interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[--brand-red]/20 bg-[--brand-red]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">
      {children}
    </span>
  );
}
