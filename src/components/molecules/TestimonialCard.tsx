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

function QuoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-7 w-7 text-[var(--brand-red)]/25"
    >
      <path d="M9.5 4.5C6 5.5 4 8.5 4 12.5c0 3 1.8 5 4.3 5 2 0 3.5-1.5 3.5-3.5 0-1.8-1.3-3.2-3-3.4.3-2 1.8-3.6 4-4.3L11.5 4c-.7.1-1.4.3-2 .5zm10 0C16 5.5 14 8.5 14 12.5c0 3 1.8 5 4.3 5 2 0 3.5-1.5 3.5-3.5 0-1.8-1.3-3.2-3-3.4.3-2 1.8-3.6 4-4.3L21.5 4c-.7.1-1.4.3-2 .5z" />
    </svg>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-[var(--slate-900)] p-6 shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]">
      <div className="flex items-center justify-between">
        <QuoteIcon />
        <StarRating value={testimonial.rating} size="sm" />
      </div>

      <p className="line-clamp-6 flex-1 text-sm leading-relaxed text-[var(--slate-300)] italic">
        {testimonial.content}
      </p>

      <div className="flex items-center gap-3 border-t border-[var(--slate-800)] pt-4">
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
