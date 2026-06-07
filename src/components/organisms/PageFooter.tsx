import { FooterColumn } from "@/components/molecules/FooterColumn";

const columns = [
  {
    title: "Légal",
    links: [
      { label: "Conditions Générales d'Utilisation", href: "/cgu" },
      { label: "Politique de Confidentialité", href: "/confidentialite" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "support@objectif4c2.ca", href: "mailto:support@objectif4c2.ca" },
    ],
  },
];

export function PageFooter() {
  return (
    <footer className="w-full border-t border-[--slate-800] bg-[--slate-900] px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-black">
              <span>🇨🇦</span>
              <span className="bg-gradient-to-r from-[--brand-red] to-[--brand-white] bg-clip-text text-transparent">
                Objectif 4C2 pour tous
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[--slate-500]">
              La plateforme de préparation TEF/TCF Canada pour les futurs résidents permanents
              francophones.
            </p>
          </div>

          {columns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        <div className="secure-canvas-wrapper mt-12 border-t border-[--slate-800] pt-6 text-center">
          <p className="text-xs text-[--slate-500]">
            © {new Date().getFullYear()} Objectif 4C2 pour tous. Tous droits réservés.
            Contenu pédagogique protégé — reproduction interdite.
          </p>
        </div>
      </div>
    </footer>
  );
}
