import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CombinationTaskEval } from "@/lib/schemas";

export interface CombinationPdfDocumentProps {
  combinationTitle: string;
  examType: string;
  globalScore: number;
  cefrLevel: string;
  appreciation: string;
  task1: CombinationTaskEval;
  task2: CombinationTaskEval;
  task3: CombinationTaskEval;
  createdAt: string;
  studentName?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  brandText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  subText: {
    marginTop: 2,
    fontSize: 9,
    color: "#475569",
  },
  headerBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  summaryBox: {
    flexDirection: "row",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    marginBottom: 18,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  summaryValueSmall: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "center",
    paddingHorizontal: 6,
  },
  scoreList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  scoreListItem: {
    fontSize: 10,
    color: "#334155",
  },
  taskHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 14,
  },
  taskHeaderLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
  },
  taskHeaderScore: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
  },
  boxBase: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  boxGray: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  boxPeach: {
    backgroundColor: "#fef3e8",
    borderWidth: 1,
    borderColor: "#fde0bc",
  },
  boxWhite: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  boxGreen: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  boxLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
    marginBottom: 5,
  },
  boxLabelUnderline: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#334155",
    marginBottom: 5,
    textDecoration: "underline",
  },
  boxLabelGreen: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#15803d",
    marginBottom: 5,
  },
  boxText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1e293b",
  },
  successText: {
    fontSize: 10,
    color: "#15803d",
  },
  tableSection: {
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  tableHeaderRow: {
    backgroundColor: "#dbeafe",
    borderTopWidth: 0,
  },
  tableCell: {
    fontSize: 8.5,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#1e40af",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

function PageFooter() {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} sur ${totalPages} — Objectif 4C2`}
      fixed
    />
  );
}

function TaskPdfPage({
  label,
  task,
  maxScore,
}: {
  label: string;
  task: CombinationTaskEval;
  maxScore: string;
}) {
  const criteria = [
    { label: "Compréhension du sujet", value: task.comprehension_du_sujet },
    { label: "Respect de méthodologie", value: task.respect_de_methodologie },
    { label: "Niveau linguistique", value: task.niveau_linguistique },
    { label: "Appréciation générale", value: task.appreciation_generale },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.taskHeaderBar}>
        <Text style={styles.taskHeaderLabel}>{label}</Text>
        <Text style={styles.taskHeaderScore}>Score : {task.score} / {maxScore}</Text>
      </View>

      <View style={[styles.boxBase, styles.boxGray]}>
        <Text style={styles.boxLabel}>Consigne</Text>
        <Text style={styles.boxText}>{task.consigne}</Text>
      </View>

      <View style={[styles.boxBase, styles.boxPeach]}>
        <Text style={styles.boxLabel}>Votre texte</Text>
        <Text style={styles.boxText}>{task.votre_texte || "—"}</Text>
      </View>

      {criteria.map((c) => (
        <View key={c.label} style={[styles.boxBase, styles.boxWhite]}>
          <Text style={styles.boxLabelUnderline}>{c.label}</Text>
          <Text style={styles.boxText}>{c.value}</Text>
        </View>
      ))}

      <View style={styles.tableSection}>
        <Text style={styles.boxLabel}>
          Correction orthographique ({task.correction_orthographique.length})
        </Text>
        {task.correction_orthographique.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.2 }]}>Erreur</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.2 }]}>Correction</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2.6 }]}>Explication</Text>
            </View>
            {task.correction_orthographique.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.2, color: "#dc2626" }]}>{c.erreur}</Text>
                <Text style={[styles.tableCell, { flex: 1.2, color: "#059669" }]}>{c.correction}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{c.type}</Text>
                <Text style={[styles.tableCell, { flex: 2.6 }]}>{c.explication}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.successText}>✓ Aucune erreur orthographique détectée.</Text>
        )}
      </View>

      <View style={[styles.boxBase, styles.boxGreen]}>
        <Text style={styles.boxLabelGreen}>Version corrigée et améliorée</Text>
        <Text style={styles.boxText}>{task.version_corrigee_et_amelioree}</Text>
      </View>

      <PageFooter />
    </Page>
  );
}

export function CombinationPdfDocument({
  combinationTitle,
  examType,
  globalScore,
  cefrLevel,
  appreciation,
  task1,
  task2,
  task3,
  createdAt,
  studentName,
}: CombinationPdfDocumentProps) {
  const evalDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tasks = [
    { label: "Tâche 1 — Courriel amical", task: task1, maxScore: "4" },
    { label: "Tâche 2 — Article de Blog", task: task2, maxScore: "7" },
    { label: "Tâche 3 — Synthèse & Argumentation", task: task3, maxScore: "9" },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.brandText}>OBJECTIF 4C2 — Rapport d&apos;évaluation</Text>
          <Text style={styles.titleText}>{combinationTitle}</Text>
          {studentName && <Text style={styles.subText}>Candidat : {studentName}</Text>}
          <Text style={styles.subText}>{examType} Canada — Évalué le {evalDate}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Score final</Text>
            <Text style={styles.summaryValue}>{globalScore.toFixed(1)}/20</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Niveau CECRL</Text>
            <Text style={styles.summaryValue}>{cefrLevel}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Appréciation</Text>
            <Text style={styles.summaryValueSmall}>{appreciation}</Text>
          </View>
        </View>

        <View style={styles.scoreList}>
          {tasks.map((t) => (
            <Text key={t.label} style={styles.scoreListItem}>
              {t.label} : {t.task.score}
            </Text>
          ))}
        </View>

        <PageFooter />
      </Page>

      {tasks.map((t) => (
        <TaskPdfPage key={t.label} label={t.label} task={t.task} maxScore={t.maxScore} />
      ))}
    </Document>
  );
}
