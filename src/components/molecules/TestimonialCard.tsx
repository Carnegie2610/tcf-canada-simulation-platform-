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
    <div className="flex h-full flex-col items-center gap-8 rounded-2xl bg-[var(--slate-900)] p-8 text-center shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(230,51,41,0.25)]">
      <p className="line-clamp-6 flex-1 text-base leading-loose text-[var(--slate-300)]">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      <StarRating value={testimonial.rating} size="sm" />

      <div className="flex flex-col items-center gap-3">
        <Avatar name={testimonial.name} avatarUrl={testimonial.avatar_path} size="lg" />
        <div>
          <p className="text-sm font-bold text-[var(--slate-200)]">{testimonial.name}</p>
          {testimonial.role_text && (
            <p className="mt-1 text-xs text-[var(--slate-500)]">{testimonial.role_text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
