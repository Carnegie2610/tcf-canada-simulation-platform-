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
      className="group flex flex-col gap-4 rounded-2xl border border-[--slate-800] bg-[--slate-900] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[--slate-600]"
    >
      <Icon emoji={icon} label={title} />
      <div className="space-y-2">
        <h3 className="font-(family-name:--font-sora) text-lg font-bold text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[--slate-400]">{description}</p>
      </div>
    </Link>
  );
}
