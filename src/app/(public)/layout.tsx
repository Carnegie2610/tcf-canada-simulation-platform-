import { PublicPageTemplate } from "@/components/templates/PublicPageTemplate";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicPageTemplate>{children}</PublicPageTemplate>;
}
