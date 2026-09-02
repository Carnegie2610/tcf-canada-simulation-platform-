import { PublicPageTemplate } from "@/components/templates/PublicPageTemplate";
import { HeroSection } from "@/components/organisms/HeroSection";
import { PackSection } from "@/components/organisms/PackSection";
import { StatsSection } from "@/components/organisms/StatsSection";
import { SkillGrid } from "@/components/organisms/SkillGrid";
import { MethodologySection } from "@/components/organisms/MethodologySection";
import { FAQSection } from "@/components/organisms/FAQSection";
import { TestimonialsSection } from "@/components/organisms/TestimonialsSection";
import { PricingSection } from "@/components/organisms/PricingSection";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/components/molecules/TestimonialCard";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id, name, role_text, rating, content, avatar_path")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <PublicPageTemplate>
      <HeroSection />
      <PackSection />
      <StatsSection />
      <SkillGrid />
      <MethodologySection />
      <FAQSection />
      <TestimonialsSection testimonials={(testimonials as Testimonial[]) ?? []} />
      <PricingSection />
    </PublicPageTemplate>
  );
}
