import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
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
  title: "Objectif 4C2 pour tous — Préparation TEF/TCF Canada",
  description:
    "Préparez l'examen TEF ou TCF Canada avec des simulations d'écriture réalistes et des corrections personnalisées par intelligence artificielle.",
  icons: {
    icon: "/favicon-rounded.svg",
    shortcut: "/favicon.ico",
    apple: "/icon-rounded.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--slate-950] text-[--slate-200]">
        {children}
      </body>
    </html>
  );
}
