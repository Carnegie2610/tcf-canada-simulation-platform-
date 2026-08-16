import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion — Objectif 4C2 pour tous",
  description: "Connectez-vous à votre espace Objectif 4C2 pour accéder à vos simulations TEF/TCF Canada.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
