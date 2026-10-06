import type { Metadata } from "next";
import { SectionLabel } from "@/components/atoms/SectionLabel";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Objectif 4C2 pour tous",
  description:
    "Comment Objectif 4C2 pour tous collecte, utilise, protège et conserve vos données personnelles sur la plateforme de préparation TEF/TCF Canada.",
  alternates: {
    canonical: "/confidentialite",
  },
};

interface Section {
  title: string;
  body: React.ReactNode;
}

const linkCls =
  "font-medium text-[var(--accent-blue-text)] underline-offset-2 transition-colors hover:underline";

const listCls = "mt-3 space-y-2 list-disc pl-5";

const sections: Section[] = [
  {
    title: "1. Responsable du traitement",
    body: (
      <p>
        Objectif 4C2 pour tous (« la Plateforme », « nous ») est responsable du traitement des
        données personnelles décrites dans la présente politique. Pour toute question relative à
        vos données, contactez-nous à{" "}
        <a href="mailto:support@objectif4c2.ca" className={linkCls}>
          support@objectif4c2.ca
        </a>
        .
      </p>
    ),
  },
  {
    title: "2. Données que nous collectons",
    body: (
      <ul className={listCls}>
        <li>
          <strong className="text-[var(--slate-200)]">Données de compte</strong> — nom, adresse
          e-mail, mot de passe (chiffré) et rôle (étudiant, administrateur), créés lors de
          l&apos;inscription ou de la création de votre compte par un administrateur.
        </li>
        <li>
          <strong className="text-[var(--slate-200)]">Contenu des simulations</strong> — vos
          productions écrites, vos enregistrements audio d&apos;expression orale, vos brouillons
          sauvegardés automatiquement, ainsi que les rapports d&apos;évaluation générés à partir de
          ce contenu.
        </li>
        <li>
          <strong className="text-[var(--slate-200)]">Témoignages</strong> — si vous soumettez un
          témoignage, nous collectons votre nom, votre profession (optionnelle), votre note et le
          contenu de votre témoignage, ainsi qu&apos;une photo de profil si vous en fournissez une.
        </li>
        <li>
          <strong className="text-[var(--slate-200)]">Données d&apos;utilisation</strong> —
          pages visitées, fonctionnalités utilisées, type d&apos;appareil et navigateur, collectées
          de façon anonymisée via notre outil d&apos;analyse (PostHog) afin d&apos;améliorer la
          Plateforme.
        </li>
        <li>
          <strong className="text-[var(--slate-200)]">Données de facturation</strong> — nous ne
          collectons ni ne stockons aucune donnée de carte bancaire sur la Plateforme. Les demandes
          d&apos;abonnement sont traitées manuellement via WhatsApp ou e-mail.
        </li>
      </ul>
    ),
  },
  {
    title: "3. Comment nous utilisons vos données",
    body: (
      <ul className={listCls}>
        <li>Fournir et faire fonctionner les simulations d&apos;examen et votre espace étudiant.</li>
        <li>
          Évaluer vos productions écrites et orales à l&apos;aide de modèles d&apos;intelligence
          artificielle (OpenAI, Anthropic ou Groq, selon la disponibilité) afin de générer un score
          CECRL et une correction détaillée.
        </li>
        <li>Gérer votre quota de simulations et le bon fonctionnement de votre abonnement.</li>
        <li>Publier, avec votre accord, votre témoignage sur la page d&apos;accueil après validation.</li>
        <li>Communiquer avec vous au sujet de votre compte, de votre abonnement ou d&apos;un support technique.</li>
        <li>Comprendre l&apos;usage de la Plateforme afin de l&apos;améliorer et de corriger les problèmes techniques.</li>
      </ul>
    ),
  },
  {
    title: "4. Intelligence artificielle et contenu soumis",
    body: (
      <p>
        Vos productions écrites et vos enregistrements oraux sont transmis à des fournisseurs
        tiers d&apos;intelligence artificielle (OpenAI, Anthropic, Groq) dans le seul but de générer
        votre évaluation. Ces fournisseurs traitent le contenu de façon automatisée pour produire
        une réponse et ne l&apos;utilisent pas pour ré-entraîner leurs modèles dans le cadre de nos
        accords d&apos;utilisation professionnelle. Nous ne partageons aucune donnée
        d&apos;identification (nom, e-mail) avec ces fournisseurs lors de l&apos;évaluation.
      </p>
    ),
  },
  {
    title: "5. Partage des données avec des tiers",
    body: (
      <>
        <p>Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement avec :</p>
        <ul className={listCls}>
          <li>
            <strong className="text-[var(--slate-200)]">Supabase</strong> — notre base de données
            et notre service d&apos;authentification et de stockage de fichiers.
          </li>
          <li>
            <strong className="text-[var(--slate-200)]">Vercel</strong> — notre hébergeur, qui
            exécute l&apos;application et ses fonctions serveur.
          </li>
          <li>
            <strong className="text-[var(--slate-200)]">OpenAI, Anthropic et Groq</strong> — pour
            l&apos;évaluation automatisée de vos productions (voir section 4).
          </li>
          <li>
            <strong className="text-[var(--slate-200)]">PostHog</strong> — pour l&apos;analyse
            d&apos;utilisation anonymisée de la Plateforme.
          </li>
        </ul>
        <p className="mt-3">
          Ces prestataires n&apos;accèdent à vos données que dans la mesure nécessaire à
          l&apos;exécution de leurs services et sont tenus contractuellement de les protéger.
        </p>
      </>
    ),
  },
  {
    title: "6. Durée de conservation",
    body: (
      <p>
        Vos données de compte et vos productions sont conservées tant que votre compte est actif,
        afin de vous permettre de consulter votre historique et vos rapports d&apos;évaluation. Si
        vous souhaitez la suppression de votre compte et de vos données, contactez-nous à{" "}
        <a href="mailto:support@objectif4c2.ca" className={linkCls}>
          support@objectif4c2.ca
        </a>
        — votre demande sera traitée dans un délai raisonnable.
      </p>
    ),
  },
  {
    title: "7. Sécurité",
    body: (
      <p>
        Vos données sont stockées sur une infrastructure protégée par des règles d&apos;accès strictes
        au niveau de la base de données (chaque utilisateur ne peut accéder qu&apos;à ses propres
        données), et les mots de passe sont chiffrés. Les ressources pédagogiques premium sont
        protégées contre la copie non autorisée. Aucun système n&apos;étant infaillible, nous ne
        pouvons toutefois garantir une sécurité absolue.
      </p>
    ),
  },
  {
    title: "8. Vos droits",
    body: (
      <p>
        Vous pouvez à tout moment demander l&apos;accès, la rectification ou la suppression de vos
        données personnelles, ou vous opposer à certains traitements, en nous contactant à{" "}
        <a href="mailto:support@objectif4c2.ca" className={linkCls}>
          support@objectif4c2.ca
        </a>
        . Vous pouvez également demander le retrait d&apos;un témoignage publié avec votre nom.
      </p>
    ),
  },
  {
    title: "9. Mineurs",
    body: (
      <p>
        La Plateforme s&apos;adresse aux personnes préparant un examen d&apos;immigration et
        n&apos;est pas destinée aux mineurs de moins de 16 ans. Nous ne collectons pas
        sciemment de données concernant des mineurs.
      </p>
    ),
  },
  {
    title: "10. Modifications de cette politique",
    body: (
      <p>
        Nous pouvons mettre à jour cette politique de confidentialité pour refléter des changements
        dans nos pratiques ou pour des raisons légales. Toute modification substantielle vous sera
        communiquée par e-mail ou via un avis sur la Plateforme.
      </p>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <SectionLabel>Légal</SectionLabel>

      <h1 className="mt-6 font-(family-name:--font-sora) text-4xl font-black tracking-tight text-[var(--slate-200)] sm:text-5xl">
        Politique de Confidentialité
      </h1>

      <p className="mt-6 text-base leading-relaxed text-[var(--slate-400)] sm:text-lg">
        Dernière mise à jour : 6 octobre 2026. Cette politique explique quelles données Objectif
        4C2 pour tous collecte, comment nous les utilisons, avec qui nous les partageons, et quels
        sont vos droits.
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-(family-name:--font-sora) text-xl font-bold text-[var(--slate-200)]">
              {section.title}
            </h2>
            <div className="mt-3 text-sm leading-relaxed text-[var(--slate-400)]">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
