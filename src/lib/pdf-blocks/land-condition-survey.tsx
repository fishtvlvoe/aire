// 土地版現況調查表 PDF 頁面元件
// 對應「肆、不動產現況說明書（土地）」34 題

import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import {
  LAND_SURVEY_QUESTIONS,
  Q14_NUISANCE_ITEMS,
  type LandSurveyData,
} from "@/lib/disclosure-schema-land-survey";

// ─── 樣式 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingVertical: 18,
    paddingHorizontal: 22,
    fontFamily: "NotoSansTC",
    fontSize: 10,
    color: "#111827",
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1F2937",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#374151",
  },
  // 題目行
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 2.7,
  },
  questionNo: {
    width: 22,
    fontSize: 9.5,
    color: "#6B7280",
  },
  questionLabel: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.25,
    paddingRight: 8,
  },
  answerGroup: {
    flexDirection: "row",
    width: 58,
    justifyContent: "flex-end",
    gap: 5,
  },
  answerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  checkbox: {
    fontSize: 9.5,
    lineHeight: 1,
  },
  answerLabel: {
    fontSize: 9,
    color: "#374151",
  },
  // 嫌惡設施多選 grid
  nuisanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginLeft: 22,
    marginBottom: 2,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    padding: 3,
    backgroundColor: "#F9FAFB",
  },
  nuisanceItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "20%",
    gap: 1,
    paddingVertical: 0.8,
    paddingHorizontal: 1,
  },
  nuisanceLabel: {
    fontSize: 7.4,
    color: "#374151",
  },
  // 最後一題（確認聲明）特殊樣式
  declarationRow: {
    marginTop: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#9CA3AF",
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  declarationText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    fontWeight: "bold",
  },
});

// ─── 輔助 ────────────────────────────────────────────────────────────────────

/** 取得 checkbox 符號 */
function getCheckbox(value: boolean | null, forTrue: boolean): string {
  if (value === null) return "☐";
  return value === forTrue ? "☑" : "☐";
}

/** 渲染單一題目行（一般題） */
function QuestionRow({
  index,
  label,
  value,
}: {
  index: number;
  label: string;
  value: boolean | null;
}) {
  return (
    <View style={styles.questionRow} wrap={false}>
      <Text style={styles.questionNo}>{index}.</Text>
      <Text style={styles.questionLabel}>{label}</Text>
      <View style={styles.answerGroup}>
        <View style={styles.answerItem}>
          <Text style={styles.checkbox}>{getCheckbox(value, true)}</Text>
          <Text style={styles.answerLabel}>是</Text>
        </View>
        <View style={styles.answerItem}>
          <Text style={styles.checkbox}>{getCheckbox(value, false)}</Text>
          <Text style={styles.answerLabel}>否</Text>
        </View>
      </View>
    </View>
  );
}

/** 渲染嫌惡設施題（含多選 grid） */
function NuisanceFacilitiesRow({ index, value }: { index: number; value: boolean | null }) {
  const q = LAND_SURVEY_QUESTIONS[13]; // index 13 = q14
  return (
    <View wrap={false}>
      <View style={styles.questionRow}>
        <Text style={styles.questionNo}>{index}.</Text>
        <Text style={styles.questionLabel}>{q.label}</Text>
        <View style={styles.answerGroup}>
          <View style={styles.answerItem}>
            <Text style={styles.checkbox}>{getCheckbox(value, true)}</Text>
            <Text style={styles.answerLabel}>是</Text>
          </View>
          <View style={styles.answerItem}>
            <Text style={styles.checkbox}>{getCheckbox(value, false)}</Text>
            <Text style={styles.answerLabel}>否</Text>
          </View>
        </View>
      </View>
      {/* 嫌惡設施子項目 5 欄 grid */}
      <View style={styles.nuisanceGrid}>
        {Q14_NUISANCE_ITEMS.map((item) => (
          <View key={item} style={styles.nuisanceItem}>
            <Text style={styles.checkbox}>☐</Text>
            <Text style={styles.nuisanceLabel}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────

interface LandConditionSurveyProps {
  surveyData: Record<string, boolean | null> | null;
}

export function LandConditionSurveyPages({
  surveyData,
}: LandConditionSurveyProps): React.ReactElement {
  /** 取得題目答案（null = 未填） */
  function getAnswer(qId: string): boolean | null {
    if (!surveyData) return null;
    const val = surveyData[qId];
    if (val === true) return true;
    if (val === false) return false;
    return null;
  }
  const nuisanceQuestion = LAND_SURVEY_QUESTIONS[13];
  const printQuestions = [
    ...LAND_SURVEY_QUESTIONS.slice(0, 13),
    ...LAND_SURVEY_QUESTIONS.slice(14, 34),
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTitle}>肆、不動產現況說明書（土地）</Text>

      {printQuestions.map((q, idx) => {
        const qNo = idx + 1;
        const value = getAnswer(q.id);

        return (
          <QuestionRow
            key={q.id}
            index={qNo}
            label={q.label}
            value={value}
          />
        );
      })}
      <NuisanceFacilitiesRow index={34} value={getAnswer(nuisanceQuestion.id)} />
    </Page>
  );
}
