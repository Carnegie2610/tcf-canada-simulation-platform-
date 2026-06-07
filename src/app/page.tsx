import { PublicPageTemplate } from "@/components/templates/PublicPageTemplate";
import { HeroSection } from "@/components/organisms/HeroSection";
import { SkillGrid } from "@/components/organisms/SkillGrid";
import { PricingSection } from "@/components/organisms/PricingSection";

export default function LandingPage() {
  return (
    <PublicPageTemplate>
      <HeroSection />
      <SkillGrid />
      <PricingSection />
    </PublicPageTemplate>
  );
}
