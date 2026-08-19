import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://objectif4c2.com"),
  title: "Objectif 4C2 pour tous — Préparation TEF/TCF Canada",
  description:
    "Préparez l'examen TEF ou TCF Canada avec des simulations d'écriture réalistes et des corrections personnalisées par intelligence artificielle.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon-rounded.png",
    shortcut: "/favicon.ico",
    apple: "/icon-rounded.png",
  },
  authors: [{ name: "Ronsard Carnegie", url: "https://ronsardcarnegie.vercel.app" }],
  creator: "Ronsard Carnegie",
  publisher: "Objectif 4C2 pour tous",
};

const SITE_URL = "https://objectif4c2.com";
const AUTHOR_URL = "https://ronsardcarnegie.vercel.app";

/**
 * Linked structured data (@graph) rather than a lone Organization node.
 *
 * Search engines treat entities as connected only when they reference each other
 * by @id, so the Person below is declared once and pointed at from the site,
 * the organisation and the software itself. `sameAs` is the property Google uses
 * to reconcile a person with their known profiles — listing the portfolio, X and
 * LinkedIn here is what lets "who built Objectif 4C2" resolve to Ronsard Carnegie.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person-ronsard-carnegie`,
      name: "Ronsard Carnegie",
      url: AUTHOR_URL,
      jobTitle: "Développeur logiciel",
      description:
        "Développeur et créateur d'Objectif 4C2 pour tous, la plateforme de préparation TEF/TCF Canada.",
      sameAs: [
        AUTHOR_URL,
        "https://x.com/Carnegie__",
        "https://www.linkedin.com/in/ronsard-carnegie",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Objectif 4C2 pour tous",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-rounded.png`,
      description:
        "Préparation à l'examen TEF/TCF Canada avec simulations d'écriture réalistes et corrections personnalisées par intelligence artificielle.",
      founder: { "@id": `${SITE_URL}/#person-ronsard-carnegie` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Objectif 4C2 pour tous",
      inLanguage: "fr",
      publisher: { "@id": `${SITE_URL}/#organization` },
      author: { "@id": `${SITE_URL}/#person-ronsard-carnegie` },
      creator: { "@id": `${SITE_URL}/#person-ronsard-carnegie` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "Objectif 4C2 pour tous",
      url: SITE_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      inLanguage: "fr",
      description:
        "Simulations d'expression écrite et orale TEF/TCF Canada, corrigées par intelligence artificielle selon les critères CECRL.",
      author: { "@id": `${SITE_URL}/#person-ronsard-carnegie` },
      creator: { "@id": `${SITE_URL}/#person-ronsard-carnegie` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[var(--slate-950)] text-[var(--slate-200)]">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
