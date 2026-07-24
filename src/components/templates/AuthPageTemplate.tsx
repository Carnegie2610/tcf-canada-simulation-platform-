import Link from "next/link";

interface AuthPageTemplateProps {
  children: React.ReactNode;
}

export function AuthPageTemplate({ children }: AuthPageTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--slate-950] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-black">
            <img src="/favicon-rounded.svg" alt="Objectif 4C2 Academy Logo" className="h-10 w-10 object-contain" />
            <span className="bg-gradient-to-r from-[--brand-red] to-[--brand-white] bg-clip-text text-transparent">
              Objectif 4C2 pour tous
            </span>
          </Link>
          <h1 className="mt-6 font-(family-name:--font-sora) text-2xl font-bold text-white">
            Connexion à votre espace
          </h1>
          <p className="mt-2 text-sm text-[--slate-400]">
            Accès réservé aux comptes provisionnés par l&apos;administrateur.
          </p>
        </div>

        <div className="rounded-2xl border border-[--slate-800] bg-[--slate-900] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
