// 土地版現況調查表 PDF 頁面元件
// 對應「肆、不動產現況說明書（土地）」35 題

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
    paddingVertical: 28,
    paddingHorizontal: 32,
    fontFamily: "NotoSansTC",
    fontSize: 9,
    color: "#111827",
  },
  pageTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
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
    paddingVertical: 4,
  },
  questionNo: {
    width: 22,
    fontSize: 8.5,
    color: "#6B7280",
    paddingTop: 1,
  },
  questionLabel: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    paddingRight: 8,
  },
  answerGroup: {
    flexDirection: "row",
    width: 90,
    justifyContent: "flex-end",
    gap: 6,
  },
  answerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  checkbox: {
    fontSize: 9,
    lineHeight: 1,
  },
  answerLabel: {
    fontSize: 8,
    color: "#374151",
  },
  // 嫌惡設施多選 grid
  nuisanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginLeft: 22,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    padding: 4,
    backgroundColor: "#F9FAFB",
  },
  nuisanceItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "20%",
    gap: 2,
    paddingVertical: 1.5,
    paddingHorizontal: 2,
  },
  nuisanceLabel: {
    fontSize: 7.5,
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
        <View style={styles.answerItem}>
          <Text style={styles.checkbox}>{value === null ? "☑" : "☐"}</Text>
          <Text style={styles.answerLabel}>未填</Text>
        </View>
      </View>
    </View>
  );
}

/** 渲染題 14（嫌惡設施，含多選 grid） */
function Question14Row({ value }: { value: boolean | null }) {
  const q = LAND_SURVEY_QUESTIONS[13]; // index 13 = q14
  return (
    <View wrap={false}>
      <View style={styles.questionRow}>
        <Text style={styles.questionNo}>14.</Text>
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
          <View style={styles.answerItem}>
            <Text style={styles.checkbox}>{value === null ? "☑" : "☐"}</Text>
            <Text style={styles.answerLabel}>未填</Text>
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

/** 渲染題 35（賣方確認聲明） */
function Question35Declaration({ value }: { value: boolean | null }) {
  const q = LAND_SURVEY_QUESTIONS[34]; // index 34 = q35
  return (
    <View style={styles.declarationRow} wrap={false}>
      <Text style={styles.checkbox}>
        {value === true ? "☑" : "☐"}
      </Text>
      <Text style={styles.declarationText}>{q.label}</Text>
    </View>
  );
}

// ─── 分頁配置 ────────────────────────────────────────────────────────────────
// 頁 1：q1–q9（一般使用與法定限制）
// 頁 2：q10–q14（保護區、嫌惡設施——q14 佔額外空間）
// 頁 3：q15–q25（地上物、歷史事故、地質）
// 頁 4：q26–q35（災害、地政、確認聲明）

const PAGE_RANGES: Array<[number, number]> = [
  [1, 9],
  [10, 14],
  [15, 25],
  [26, 35],
];

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

  return (
    <>
      {PAGE_RANGES.map(([from, to], pageIndex) => {
        const questionsOnPage = LAND_SURVEY_QUESTIONS.slice(from - 1, to);

        return (
          <Page
            key={`land-survey-${pageIndex}`}
            size="A4"
            style={styles.page}
          >
            {/* 頁標題 */}
            <Text style={styles.pageTitle}>
              肆、不動產現況說明書（土地）
            </Text>

            {/* 題目清單 */}
            {questionsOnPage.map((q, idx) => {
              const qNo = from + idx;
              const value = getAnswer(q.id);

              // 題 35 — 確認聲明特殊渲染
              if (qNo === 35) {
                return <Question35Declaration key={q.id} value={value} />;
              }

              // 題 14 — 嫌惡設施含子項目 grid
              if (qNo === 14) {
                return <Question14Row key={q.id} value={value} />;
              }

              // 一般題
              return (
                <QuestionRow
                  key={q.id}
                  index={qNo}
                  label={q.label}
                  value={value}
                />
              );
            })}
          </Page>
        );
      })}
    </>
  );
}
