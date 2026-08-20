import { LibraryCanvas } from "@/components/organisms/student/LibraryCanvas";
import { BackButton } from "@/components/atoms/BackButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResourceLibrary, type StudentResource } from "@/components/organisms/student/ResourceLibrary";

const RESOURCES = [
  {
    id: "structure",
    icon: "📐",
    title: "Gabarits de rédaction",
    content: `STRUCTURE POUR L'EXPRESSION ÉCRITE — TEF/TCF Canada

Introduction (2–3 phrases)
• Reformuler le sujet avec vos propres mots
• Annoncer le plan (deux ou trois parties)
• Exemple : « Cette question soulève un enjeu important. Dans un premier temps, nous examinerons... »

Développement — Partie 1 (4–6 phrases)
• Idée principale + argument
• Exemple illustratif
• Phrase de transition vers la partie 2

Développement — Partie 2 (4–6 phrases)
• Contre-argument ou perspective complémentaire
• Exemple illustratif
• Phrase de bilan

Conclusion (2–3 phrases)
• Synthèse des deux parties
• Ouverture sur une perspective plus large`,
  },
  {
    id: "connectors",
    icon: "🔗",
    title: "Connecteurs logiques essentiels",
    content: `CONNECTEURS LOGIQUES — Niveau B2/C1

Addition : de plus, par ailleurs, en outre, qui plus est, à cela s'ajoute
Opposition : cependant, néanmoins, toutefois, or, en revanche, malgré cela
Cause : en raison de, étant donné que, vu que, du fait que, par conséquent
Conséquence : ainsi, donc, c'est pourquoi, de ce fait, il en résulte que
Illustration : à titre d'exemple, notamment, c'est le cas de, tel que
Concession : certes, bien que (+subj.), quoique (+subj.), malgré que (+subj.)
Reformulation : autrement dit, c'est-à-dire, en d'autres termes, soit
Conclusion : en définitive, en somme, pour conclure, en guise de conclusion`,
  },
  {
    id: "vocabulary",
    icon: "📖",
    title: "Vocabulaire thématique",
    content: `CHAMPS LEXICAUX FRÉQUENTS — TEF/TCF Canada

Environnement & développement durable
→ l'empreinte carbone, les énergies renouvelables, le réchauffement climatique,
   la biodiversité, le développement durable, l'éco-responsabilité

Société & immigration (contexte canadien)
→ la diversité culturelle, l'intégration, le multiculturalisme, la citoyenneté,
   la politique d'immigration, les minorités visibles

Travail & économie
→ le marché du travail, l'entrepreneuriat, la reconversion professionnelle,
   les inégalités salariales, le télétravail, la mondialisation

Technologie & numérique
→ l'intelligence artificielle, la transformation numérique, la cybersécurité,
   les données personnelles, l'économie de plateforme, le droit à la déconnexion

Santé & bien-être
→ la santé mentale, les soins palliatifs, l'accès aux soins, la prévention,
   le système de santé universel, les maladies chroniques`,
  },
  {
    id: "sentences",
    icon: "✏️",
    title: "Phrases modèles pour la rédaction",
    content: `PHRASES MODÈLES — À adapter à votre sujet

Introduire un sujet
→ « La question de [sujet] occupe une place centrale dans les débats contemporains. »
→ « Il convient de s'interroger sur les implications de [phénomène]. »

Exprimer une opinion nuancée
→ « S'il est vrai que..., il n'en demeure pas moins que... »
→ « Bien que certains soutiennent que..., force est de constater que... »

Citer un exemple
→ « À titre illustratif, on peut mentionner le cas de... »
→ « Prenons l'exemple de [situation concrète], qui démontre clairement que... »

Conclure et ouvrir
→ « En définitive, il apparaît que [bilan]. Cette réflexion nous invite à... »
→ « Pour conclure, retenons que... La question demeure cependant entière quant à... »`,
  },
];

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();

  // Admin-uploaded PDFs. Failure-tolerant: the built-in written guides below are
  // the core of this page and must still render if the catalogue is unavailable.
  let resources: StudentResource[] = [];
  try {
    const { data } = await supabase
      .from("resources")
      .select("id, title, description, file_size")
      .order("created_at", { ascending: false });
    resources = (data ?? []) as StudentResource[];
  } catch (err) {
    console.error("[library] resource catalogue unavailable:", err);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <BackButton href="/dashboard" label="Tableau de bord" />
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-white)]">
          Bibliothèque de ressources
        </h1>
        <p className="mt-1 text-sm text-[var(--slate-400)]">
          Matériaux pédagogiques exclusifs. Contenu protégé — reproduction et distribution interdites.
        </p>
      </div>

      <div className="rounded-xl border border-yellow-800/40 bg-yellow-900/10 px-4 py-3 flex items-center gap-2">
        <span className="text-yellow-400 text-sm">🔒</span>
        <p className="text-xs text-yellow-400">
          Ces ressources sont fournies à titre exclusivement personnel. Toute copie ou redistribution est strictement interdite.
        </p>
      </div>

      <ResourceLibrary resources={resources} />

      <LibraryCanvas>
        <div className="space-y-4">
          {RESOURCES.map((res) => (
            <div
              key={res.id}
              className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-[var(--slate-800)] px-5 py-3">
                <span className="text-xl">{res.icon}</span>
                <h2 className="text-sm font-semibold text-[var(--brand-white)]">
                  {res.title}
                </h2>
              </div>
              <div className="px-5 py-4 text-sm text-[var(--slate-300)] font-mono leading-relaxed whitespace-pre-wrap">
                {res.content}
              </div>
            </div>
          ))}
        </div>
      </LibraryCanvas>
    </div>
  );
}
