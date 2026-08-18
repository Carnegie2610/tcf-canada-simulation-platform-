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
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Objectif 4C2 pour tous",
  url: "https://objectif4c2.com",
  logo: "https://objectif4c2.com/icon-rounded.png",
  description:
    "Préparation à l'examen TEF/TCF Canada avec simulations d'écriture réalistes et corrections personnalisées par intelligence artificielle.",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
