import { GlobalNav } from "@/components/organisms/GlobalNav";
import { PageFooter } from "@/components/organisms/PageFooter";
import { WhatsAppButton } from "@/components/atoms/WhatsAppButton";

interface PublicPageTemplateProps {
  children: React.ReactNode;
}

export function PublicPageTemplate({ children }: PublicPageTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--slate-950)]">
      <GlobalNav />
      <main className="flex-1">{children}</main>
      <PageFooter />
      <WhatsAppButton />
    </div>
  );
}
