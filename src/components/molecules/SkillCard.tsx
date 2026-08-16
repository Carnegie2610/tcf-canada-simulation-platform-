import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

interface SkillCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export function SkillCard({ icon, title, description, href }: SkillCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl bg-[var(--slate-900)] p-6 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]"
    >
      <Icon emoji={icon} label={title} />
      <div className="space-y-2">
        <h3 className="font-(family-name:--font-sora) text-lg font-bold text-[var(--slate-200)]">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--slate-400)]">{description}</p>
      </div>
    </Link>
  );
}
