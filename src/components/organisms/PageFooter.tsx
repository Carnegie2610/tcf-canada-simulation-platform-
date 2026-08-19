import { FooterColumn } from "@/components/molecules/FooterColumn";

// Official brand marks. Both use `currentColor` so they inherit the link's hover
// colour, and are aria-hidden — the accessible name lives on the wrapping <a>.
function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

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
    <footer className="w-full border-t border-[var(--slate-800)] bg-[var(--slate-900)] px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-black">
              <span>🇨🇦</span>
              <span className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-white)] bg-clip-text text-transparent">
                Objectif 4C2 pour tous
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--slate-500)]">
              La plateforme de préparation TEF/TCF Canada pour les futurs résidents permanents
              francophones.
            </p>
          </div>

          {columns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--slate-800)] pt-6 text-center">
          {/* Kept outside the credit block below: secure-canvas-wrapper disables
              pointer events, which would make the author links unclickable. */}
          <div className="secure-canvas-wrapper">
            <p className="text-xs text-[var(--slate-500)]">
              © {new Date().getFullYear()} Objectif 4C2 pour tous. Tous droits réservés.
              Contenu pédagogique protégé — reproduction interdite.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-[var(--slate-500)]">
            <p>
              Conçu et développé par{" "}
              <a
                href="https://ronsardcarnegie.vercel.app"
                target="_blank"
                rel="author me noopener noreferrer"
                className="font-semibold text-[var(--accent-blue-text)] underline-offset-2 transition-colors hover:underline"
              >
                Ronsard Carnegie
              </a>
            </p>

            <span className="text-[var(--slate-700)]" aria-hidden="true">
              ·
            </span>

            <div className="flex items-center gap-3">
              <a
                href="https://x.com/Carnegie__"
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="Ronsard Carnegie sur X"
                title="Ronsard Carnegie sur X"
                className="text-[var(--slate-500)] transition-colors hover:text-[var(--slate-200)]"
              >
                <XIcon />
              </a>
              <a
                href="https://www.linkedin.com/in/ronsard-carnegie"
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="Ronsard Carnegie sur LinkedIn"
                title="Ronsard Carnegie sur LinkedIn"
                className="text-[var(--slate-500)] transition-colors hover:text-[#0A66C2]"
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
