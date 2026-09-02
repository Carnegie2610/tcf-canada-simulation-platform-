import { Avatar } from "@/components/atoms/Avatar";
import { StarRating } from "@/components/atoms/StarRating";

export interface Testimonial {
  id: string;
  name: string;
  role_text: string | null;
  rating: number;
  content: string;
  avatar_path: string | null;
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-[var(--slate-900)] p-6 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]">
      <StarRating value={testimonial.rating} size="sm" />
      <p className="flex-1 text-sm leading-relaxed text-[var(--slate-300)]">
        &laquo; {testimonial.content} &raquo;
      </p>
      <div className="flex items-center gap-3">
        <Avatar name={testimonial.name} avatarUrl={testimonial.avatar_path} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--slate-200)]">
            {testimonial.name}
          </p>
          {testimonial.role_text && (
            <p className="truncate text-xs text-[var(--slate-500)]">{testimonial.role_text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
