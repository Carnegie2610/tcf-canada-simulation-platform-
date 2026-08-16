import { PublicPageTemplate } from "@/components/templates/PublicPageTemplate";
import { HeroSection } from "@/components/organisms/HeroSection";
import { PackSection } from "@/components/organisms/PackSection";
import { StatsSection } from "@/components/organisms/StatsSection";
import { SkillGrid } from "@/components/organisms/SkillGrid";
import { MethodologySection } from "@/components/organisms/MethodologySection";
import { FAQSection } from "@/components/organisms/FAQSection";
import { PricingSection } from "@/components/organisms/PricingSection";

export default function LandingPage() {
  return (
    <PublicPageTemplate>
      <HeroSection />
      <PackSection />
      <StatsSection />
      <SkillGrid />
      <MethodologySection />
      <FAQSection />
      <PricingSection />
    </PublicPageTemplate>
  );
}
