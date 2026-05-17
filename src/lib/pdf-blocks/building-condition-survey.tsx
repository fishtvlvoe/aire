// 成屋版現況調查表 PDF 頁面元件
// 對應「肆、不動產現況說明書（建物）」58 題

import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import {
  BUILDING_SURVEY_QUESTIONS,
  type BuildingSurveyData,
} from "@/lib/disclosure-schema-building-survey";
import { Q14_NUISANCE_ITEMS } from "@/lib/disclosure-schema-land-survey";

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
    marginTop: 10,
    marginBottom: 6,
    color: "#374151",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 3,
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
  // 確認聲明特殊樣式（第 35 題）
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
  const q = BUILDING_SURVEY_QUESTIONS[13]; // index 13 = q14
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
  const q = BUILDING_SURVEY_QUESTIONS[34]; // index 34 = q35
  return (
    <View style={styles.declarationRow} wrap={false}>
      <Text style={styles.checkbox}>
        {value === true ? "☑" : "☐"}
      </Text>
      <Text style={styles.declarationText}>{q.label}</Text>
    </View>
  );
}

// ─── Section 標題渲染 ────────────────────────────────────────────────────────

/** 各 section 的中文標題對應（用於分頁渲染時在第一題前加標題） */
const SECTION_DISPLAY: Record<string, string> = {
  '基地現況調查': '一、基地現況調查（共 35 題）',
  '稅費告知':     '二、稅費相關告知',
  '建物瑕疵':     '三、建物瑕疵調查',
  '設備狀況':     '四、設備狀況',
  '管理狀況':     '五、管理狀況',
  '停車位':       '六、停車位',
};

// ─── 分頁配置 ────────────────────────────────────────────────────────────────
// 頁 1：q1–q14（基地調查前半，含嫌惡設施 grid）
// 頁 2：q15–q35（基地調查後半，含確認聲明）
// 頁 3：q36–q38（稅費）+ q39–q45（建物瑕疵）
// 頁 4：q46–q51（設備）+ q52–q56（管理）+ q57–q58（停車位）

const PAGE_RANGES: Array<[number, number]> = [
  [1,  14],
  [15, 35],
  [36, 45],
  [46, 58],
];

// ─── 主元件 ──────────────────────────────────────────────────────────────────

interface BuildingConditionSurveyProps {
  surveyData: Record<string, boolean | null> | null;
}

export function BuildingConditionSurveyPages({
  surveyData,
}: BuildingConditionSurveyProps): React.ReactElement {
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
        const questionsOnPage = BUILDING_SURVEY_QUESTIONS.slice(from - 1, to);

        // 追蹤本頁已渲染過的 section，避免重複顯示標題
        const renderedSections = new Set<string>();

        return (
          <Page
            key={`building-survey-${pageIndex}`}
            size="A4"
            style={styles.page}
          >
            {/* 頁標題 */}
            <Text style={styles.pageTitle}>
              肆、不動產現況說明書（建物）
            </Text>

            {/* 題目清單 */}
            {questionsOnPage.map((q, idx) => {
              const qNo = from + idx;
              const value = getAnswer(q.id);
              const elements: React.ReactNode[] = [];

              // Section 標題（每個 section 第一題前插入）
              if (!renderedSections.has(q.section)) {
                renderedSections.add(q.section);
                elements.push(
                  <Text key={`section-${q.section}`} style={styles.sectionTitle}>
                    {SECTION_DISPLAY[q.section] ?? q.section}
                  </Text>
                );
              }

              // 題 35 — 確認聲明特殊渲染
              if (qNo === 35) {
                elements.push(<Question35Declaration key={q.id} value={value} />);
                return elements;
              }

              // 題 14 — 嫌惡設施含子項目 grid
              if (qNo === 14) {
                elements.push(<Question14Row key={q.id} value={value} />);
                return elements;
              }

              // 一般題
              elements.push(
                <QuestionRow
                  key={q.id}
                  index={qNo}
                  label={q.label}
                  value={value}
                />
              );

              return elements;
            })}
          </Page>
        );
      })}
    </>
  );
}
