import Link from "next/link";
import { GlobalNav } from "@/components/organisms/GlobalNav";
import { PageFooter } from "@/components/organisms/PageFooter";

interface AuthPageTemplateProps {
  children: React.ReactNode;
  /** Widens the container for content that needs more room (e.g. the 8-box OTP
   * input) — defaults to the standard narrow auth-form width. */
  wide?: boolean;
  /** Hides the "Connexion à votre espace" title/subtitle block — pages that show
   * their own heading inside the card (e.g. the OTP verification step) don't need
   * it repeated above the card too. */
  showHeading?: boolean;
  /** Shows a button-styled back link above the logo/brand row, in the normal
   * document flow (not fixed to a viewport corner) — pages that are a step within
   * a larger flow (e.g. OTP verification) use this to get back to the previous step. */
  backHref?: string;
  backLabel?: string;
}

export function AuthPageTemplate({
  children,
  wide = false,
  showHeading = true,
  backHref,
  backLabel = "← Retour à la connexion",
}: AuthPageTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--slate-950)]">
      <GlobalNav />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className={`w-full space-y-8 ${wide ? "max-w-xl" : "max-w-md"}`}>
          {backHref && (
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue-400)] transition-colors hover:text-[var(--blue-300)]"
            >
              {backLabel}
            </Link>
          )}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center gap-2 text-lg font-black">
              <img src="/icon-rounded.png" alt="Objectif 4C2 Academy Logo" width={40} height={40} className="h-10 w-10 object-contain" />
              <span className="text-[var(--brand-white)]">Objectif 4C2 pour tous</span>
            </Link>
            {showHeading && (
              <>
                <h1 className="mt-6 font-(family-name:--font-sora) text-2xl font-bold text-[var(--slate-200)]">
                  Connexion à votre espace
                </h1>
                <p className="mt-2 text-sm text-[var(--slate-400)]">
                  Accès réservé aux comptes provisionnés par l&apos;administrateur.
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--blue-900)] bg-[var(--slate-900)] p-8">
            {children}
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
