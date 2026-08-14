import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { OralTaskEval } from "@/lib/schemas";

export interface OralPdfDocumentProps {
  oralCombinationTitle: string;
  examType: string;
  globalScore: number;
  cefrLevel: string;
  appreciation: string;
  task1: OralTaskEval;
  task2: OralTaskEval;
  task3: OralTaskEval;
  speakingDurationSeconds1: number;
  speakingDurationSeconds2: number;
  speakingDurationSeconds3: number;
  createdAt: string;
  studentName?: string;
}

const C = {
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50:  "#f8fafc",
  crimson:  "#c5192d",
  crimsonLight: "#fef2f2",
  white:    "#ffffff",
  green:    "#059669",
  amber:    "#d97706",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#dbeafe", text: "#1d4ed8" },
  A2: { bg: "#d1fae5", text: "#065f46" },
  B1: { bg: "#fef9c3", text: "#854d0e" },
  B2: { bg: "#ffedd5", text: "#9a3412" },
  C1: { bg: "#fce7f3", text: "#9d174d" },
  C2: { bg: "#ede9fe", text: "#4c1d95" },
};

function parseScore(scoreStr: string): number {
  return parseFloat(scoreStr.split("/")[0]) || 0;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes} min ${seconds.toString().padStart(2, "0")}s`;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: C.slate50,
    color: C.slate800,
  },

  // ── Cover: logo row ───────────────────────────────────────────────
  logoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  logoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIconBox: {
    width: 44,
    height: 44,
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  logoTextBlock: {
    flexDirection: "column",
  },
  logoMainText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    letterSpacing: -0.5,
  },
  logoSubText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.crimson,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  logoRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  crimsonDivider: {
    width: 2,
    height: 36,
    backgroundColor: C.crimson,
    borderRadius: 1,
  },
  reportIdBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  reportIdText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
  },
  reportDateText: {
    fontSize: 9,
    color: C.slate500,
    marginTop: 3,
  },

  // ── Cover: title ──────────────────────────────────────────────────
  coverTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.slate700,
    marginBottom: 16,
  },

  // ── Cover: hero grid ──────────────────────────────────────────────
  heroGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  heroCardLeft: {
    flex: 1,
    backgroundColor: C.slate900,
    borderRadius: 10,
    padding: 18,
  },
  heroCardRight: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  heroLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: C.slate400,
    marginBottom: 8,
  },
  heroLabelDark: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: C.slate500,
    marginBottom: 8,
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 6,
  },
  heroExamTag: {
    fontSize: 9,
    color: C.slate400,
  },
  heroCefrLevel: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 10,
  },
  cefrScale: {
    flexDirection: "row",
    gap: 4,
  },
  cefrChip: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // ── Cover: score footer ───────────────────────────────────────────
  scoreSection: {
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: C.slate200,
    gap: 10,
  },
  scoreSectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: C.slate500,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "column",
    gap: 4,
  },
  scoreRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreRowLabel: {
    fontSize: 9,
    color: C.slate700,
  },
  scoreRowValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.slate200,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: C.slate900,
    borderRadius: 3,
  },
  globalScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.slate200,
    marginTop: 2,
  },
  globalScoreLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.slate700,
  },
  globalScoreValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.crimson,
  },

  // ── Task pages ────────────────────────────────────────────────────
  taskHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.slate900,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 14,
  },
  taskHeaderLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  scorePill: {
    backgroundColor: C.crimson,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  scorePillText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  verdictPill: {
    backgroundColor: C.slate700,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 6,
  },
  verdictPillText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.slate100,
  },
  consigneBox: {
    backgroundColor: C.white,
    borderLeftWidth: 4,
    borderLeftColor: C.crimson,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  consigneLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: C.crimson,
    marginBottom: 5,
  },
  consigneText: {
    fontSize: 10,
    color: C.slate700,
    lineHeight: 1.5,
    fontFamily: "Helvetica-Oblique",
  },
  candidateTextBox: {
    backgroundColor: "#fef3e8",
    borderWidth: 1,
    borderColor: "#fde0bc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  candidateTextLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: C.amber,
    marginBottom: 5,
  },
  candidateText: {
    fontSize: 10,
    color: C.slate800,
    lineHeight: 1.55,
  },
  analysisGrid: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 10,
  },
  analysisCell: {
    width: "100%",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 6,
    padding: 9,
  },
  analysisCellHighlight: {
    width: "100%",
    backgroundColor: C.crimsonLight,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 6,
    padding: 9,
  },
  analysisCellLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.slate500,
    marginBottom: 4,
    textDecoration: "underline",
  },
  analysisCellLabelHighlight: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.crimson,
    marginBottom: 4,
    textDecoration: "underline",
  },
  analysisCellText: {
    fontSize: 9.5,
    color: C.slate800,
    lineHeight: 1.5,
  },
  durationCell: {
    width: "100%",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 6,
    padding: 9,
  },
  durationLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.green,
    marginBottom: 4,
    textDecoration: "underline",
  },
  durationText: {
    fontSize: 9.5,
    color: C.slate800,
    lineHeight: 1.5,
    fontFamily: "Helvetica-Bold",
  },

  // ── Recurring errors / strengths / priorities ─────────────────────
  calloutCell: {
    width: "100%",
    borderRadius: 6,
    padding: 9,
    marginBottom: 6,
  },
  recurringCell: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  strengthCell: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  priorityCell: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  calloutTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 9,
    color: C.slate700,
    lineHeight: 1.45,
  },

  // ── Section headings ──────────────────────────────────────────────
  sectionHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: C.crimson,
    marginBottom: 6,
    marginTop: 2,
  },

  tableSection: {
    marginBottom: 10,
  },
  tableSectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: C.slate500,
    marginBottom: 5,
  },

  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: C.slate400,
  },
  footerDot: {
    width: 4,
    height: 4,
    backgroundColor: C.crimson,
    borderRadius: 2,
  },
});

// ── Sub-components ────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>OBJECTIF 4C2 — Rapport d'evaluation orale</Text>
      <View style={styles.footerDot} />
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function CoverPage({
  oralCombinationTitle,
  examType,
  globalScore,
  cefrLevel,
  appreciation,
  task1,
  task2,
  task3,
  createdAt,
  studentName,
}: OralPdfDocumentProps) {
  const evalDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tasks = [
    { label: "Tache 1", score: task1.score, max: 20 },
    { label: "Tache 2", score: task2.score, max: 20 },
    { label: "Tache 3", score: task3.score, max: 20 },
  ];

  return (
    <Page size="A4" style={styles.page}>
      {/* Logo row */}
      <View style={styles.logoRow}>
        <View style={styles.logoLeft}>
          <View style={styles.logoIconBox}>
            <Image src="/icon-rounded.png" style={styles.logoImg} />
          </View>
          <View style={styles.logoTextBlock}>
            <Text style={styles.logoMainText}>OBJECTIF</Text>
            <Text style={styles.logoSubText}>4 C 2</Text>
          </View>
        </View>

        <View style={styles.logoRight}>
          <View style={styles.crimsonDivider} />
          <View style={styles.reportIdBlock}>
            <Text style={styles.reportIdText}>ID: #O4C2-ORAL</Text>
            <Text style={styles.reportDateText}>{evalDate}</Text>
            <Text style={[styles.reportDateText, { marginTop: 1 }]}>{examType} Canada</Text>
          </View>
        </View>
      </View>

      {/* Combination title */}
      <Text style={styles.coverTitle}>{oralCombinationTitle}</Text>

      {/* Hero grid */}
      <View style={styles.heroGrid}>
        {/* Left: Candidate */}
        <View style={styles.heroCardLeft}>
          <Text style={styles.heroLabel}>Candidat</Text>
          <Text style={styles.heroName}>{studentName ?? "—"}</Text>
          <Text style={styles.heroExamTag}>{examType} Canada — Expression Orale</Text>
        </View>

        {/* Right: CEFR level */}
        <View style={styles.heroCardRight}>
          <Text style={styles.heroLabelDark}>Niveau atteint</Text>
          <Text style={styles.heroCefrLevel}>{cefrLevel}</Text>
          <View style={styles.cefrScale}>
            {CEFR_LEVELS.map((lvl) => {
              const isActive = lvl === cefrLevel;
              const chipColor = CEFR_COLORS[lvl] ?? { bg: C.slate100, text: C.slate500 };
              return (
                <Text
                  key={lvl}
                  style={[
                    styles.cefrChip,
                    {
                      backgroundColor: isActive ? C.crimson : chipColor.bg,
                      color: isActive ? C.white : chipColor.text,
                    },
                  ]}
                >
                  {lvl}
                </Text>
              );
            })}
          </View>
        </View>
      </View>

      {/* Score footer */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreSectionLabel}>Detail des scores par tache</Text>

        {tasks.map((t) => {
          const numeric = parseScore(t.score);
          const pct = Math.min(1, numeric / t.max);
          return (
            <View key={t.label} style={styles.scoreRow}>
              <View style={styles.scoreRowTop}>
                <Text style={styles.scoreRowLabel}>{t.label}</Text>
                <Text style={styles.scoreRowValue}>{t.score} pts</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(pct * 100).toFixed(1)}%` }]} />
              </View>
            </View>
          );
        })}

        <View style={styles.globalScoreRow}>
          <Text style={styles.globalScoreLabel}>Score final — {appreciation}</Text>
          <Text style={styles.globalScoreValue}>{globalScore.toFixed(1)} / 20</Text>
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}

function TaskPage({
  label,
  task,
  speakingDurationSeconds,
}: {
  label: string;
  task: OralTaskEval;
  speakingDurationSeconds: number;
}) {
  const criteria: { key: string; value: string; highlight: boolean }[] = [
    { key: "Comprehension du sujet",       value: task.comprehension_du_sujet,      highlight: false },
    { key: "Respect de methodologie",      value: task.respect_de_methodologie,     highlight: false },
    { key: "Niveau linguistique",          value: task.niveau_linguistique,         highlight: false },
    { key: "Fluidite",                     value: task.fluidite,                    highlight: false },
    { key: "Prononciation et intonation",  value: task.prononciation_et_intonation, highlight: false },
    { key: "Appreciation generale",        value: task.appreciation_generale,       highlight: true  },
  ];

  const pointsForts = task.points_forts ?? [];
  const prioritesATravailler = task.priorites_a_travailler ?? [];
  const erreursRecurrentes = task.erreurs_recurrentes ?? [];
  const connecteursLogiques = task.connecteurs_logiques ?? { utilises: [], manquants: [] };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.taskHeaderBar}>
        <Text style={styles.taskHeaderLabel}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {task.pertinence_verdict ? (
            <View style={styles.verdictPill}>
              <Text style={styles.verdictPillText}>{task.pertinence_verdict}</Text>
            </View>
          ) : null}
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>{task.score} / 20 pts</Text>
          </View>
        </View>
      </View>

      {/* Consigne */}
      <View style={styles.consigneBox}>
        <Text style={styles.consigneLabel}>Consigne</Text>
        <Text style={styles.consigneText}>{task.consigne}</Text>
      </View>

      {/* Section A — Transcription */}
      <Text style={styles.sectionHeading}>Section A — Transcription de votre reponse orale</Text>
      <View style={styles.candidateTextBox}>
        <Text style={styles.candidateTextLabel}>Transcription</Text>
        <Text style={styles.candidateText}>{task.transcript || "—"}</Text>
      </View>

      {/* Section B — Criteres CECR */}
      <Text style={styles.sectionHeading}>Section B — Criteres CECR</Text>
      <View style={styles.analysisGrid}>
        <View style={styles.durationCell}>
          <Text style={styles.durationLabel}>Duree de la reponse</Text>
          <Text style={styles.durationText}>{formatDuration(speakingDurationSeconds)}</Text>
        </View>
      </View>
      <View style={styles.analysisGrid}>
        {criteria.map((c) => (
          <View key={c.key} style={c.highlight ? styles.analysisCellHighlight : styles.analysisCell}>
            <Text style={c.highlight ? styles.analysisCellLabelHighlight : styles.analysisCellLabel}>
              {c.key}
            </Text>
            <Text style={styles.analysisCellText}>{c.value}</Text>
          </View>
        ))}
      </View>

      {/* Section C — Points forts, priorites, erreurs recurrentes, et plus */}
      {(pointsForts.length > 0 ||
        prioritesATravailler.length > 0 ||
        erreursRecurrentes.length > 0 ||
        task.registre_et_tonalite ||
        connecteursLogiques.utilises.length > 0 ||
        connecteursLogiques.manquants.length > 0 ||
        task.exercice_recommande ||
        task.comparaison_niveau_vise) && (
        <>
          <Text style={styles.sectionHeading}>Section C — Analyse complementaire</Text>

          {pointsForts.length > 0 && (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Points forts</Text>
              {pointsForts.map((p, i) => (
                <View key={i} style={[styles.calloutCell, styles.strengthCell]}>
                  <Text style={styles.calloutText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {prioritesATravailler.length > 0 && (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Priorites a travailler</Text>
              {prioritesATravailler.map((p, i) => (
                <View key={i} style={[styles.calloutCell, styles.priorityCell]}>
                  <Text style={styles.calloutText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {erreursRecurrentes.length > 0 && (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Erreurs recurrentes</Text>
              {erreursRecurrentes.map((r, i) => (
                <View key={i} style={[styles.calloutCell, styles.recurringCell]}>
                  <Text style={styles.calloutTitle}>{r.pattern} — {r.occurrences}x</Text>
                  {r.exemples.length > 0 && (
                    <Text style={styles.calloutText}>{r.exemples.join(" · ")}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {task.registre_et_tonalite ? (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Registre et tonalite</Text>
              <View style={styles.calloutCell}>
                <Text style={styles.calloutText}>{task.registre_et_tonalite}</Text>
              </View>
            </View>
          ) : null}

          {(connecteursLogiques.utilises.length > 0 || connecteursLogiques.manquants.length > 0) && (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Connecteurs logiques</Text>
              <View style={styles.calloutCell}>
                {connecteursLogiques.utilises.length > 0 && (
                  <Text style={styles.calloutText}>Utilises : {connecteursLogiques.utilises.join(", ")}</Text>
                )}
                {connecteursLogiques.manquants.length > 0 && (
                  <Text style={styles.calloutText}>A enrichir : {connecteursLogiques.manquants.join(", ")}</Text>
                )}
              </View>
            </View>
          )}

          {task.exercice_recommande ? (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Exercice recommande</Text>
              <View style={styles.calloutCell}>
                <Text style={styles.calloutText}>{task.exercice_recommande}</Text>
              </View>
            </View>
          ) : null}

          {task.comparaison_niveau_vise ? (
            <View style={styles.tableSection} wrap={false}>
              <Text style={styles.tableSectionLabel}>Comparaison au niveau vise</Text>
              <View style={styles.calloutCell}>
                <Text style={styles.calloutText}>{task.comparaison_niveau_vise}</Text>
              </View>
            </View>
          ) : null}
        </>
      )}

      <PageFooter />
    </Page>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function OralPdfDocument(props: OralPdfDocumentProps) {
  return (
    <Document>
      <CoverPage {...props} />
      <TaskPage label="Tache 1" task={props.task1} speakingDurationSeconds={props.speakingDurationSeconds1} />
      <TaskPage label="Tache 2" task={props.task2} speakingDurationSeconds={props.speakingDurationSeconds2} />
      <TaskPage label="Tache 3" task={props.task3} speakingDurationSeconds={props.speakingDurationSeconds3} />
    </Document>
  );
}
