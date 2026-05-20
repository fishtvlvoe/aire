// 成屋版現況調查表 PDF 頁面元件
// MVP 對應客戶照片中的 38 題表單：空白勾選框 + 可書寫欄位。

import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import {
  createHouseConditionSurveyDraft,
  type SurveyQuestionDraft,
} from "@/lib/page-contracts/house-mvp";

// ─── 樣式 ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingVertical: 28,
    paddingHorizontal: 32,
    fontFamily: "NotoSansTC",
    fontSize: 7.5,
    color: "#111827",
  },
  pageTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1F2937",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    color: "#4B5563",
  },
  table: {
    borderWidth: 1,
    borderColor: "#111827",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D1D5DB",
  },
  cell: {
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#D1D5DB",
  },
  lastCell: {
    paddingVertical: 2.5,
    paddingHorizontal: 3,
  },
  questionLabel: {
    lineHeight: 1.25,
  },
  checkGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  box: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#111827",
  },
  writableLine: {
    minHeight: 9,
    borderBottomWidth: 0.75,
    borderBottomColor: "#9CA3AF",
    flex: 1,
  },
  amountCell: {
    flex: 1,
  },
});

// ─── 輔助 ────────────────────────────────────────────────────────────────────

function CheckboxLabel({ label }: { label: string }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.box} />
      <Text>{label}</Text>
    </View>
  );
}

function QuestionRow({ question }: { question: SurveyQuestionDraft }) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text style={[styles.cell, { width: 26, textAlign: "center" }]}>{question.questionNo}</Text>
      <Text style={[styles.cell, styles.questionLabel, { flex: 1 }]}>{question.label}</Text>
      <View style={[styles.cell, { width: 82 }]}>
        {question.answerType === "amount" ? (
          <View style={styles.writableLine} />
        ) : (
          <View style={styles.checkGroup}>
            <CheckboxLabel label="是" />
            <CheckboxLabel label="否" />
          </View>
        )}
      </View>
      <View style={[styles.lastCell, { width: 100 }]}>
        <View style={styles.writableLine} />
      </View>
    </View>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────

interface BuildingConditionSurveyProps {
  surveyData: Record<string, boolean | null> | null;
}

export function BuildingConditionSurveyPages({
  surveyData: _surveyData,
}: BuildingConditionSurveyProps): React.ReactElement {
  const draft = createHouseConditionSurveyDraft();

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTitle}>肆、現況調查表</Text>
      <View style={styles.metaRow}>
        <Text>類型：{draft.propertyType}</Text>
        <Text>表單版本：{draft.formVersion}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.cell, { width: 26, textAlign: "center" }]}>項次</Text>
          <Text style={[styles.cell, { flex: 1 }]}>調查事項</Text>
          <Text style={[styles.cell, { width: 82 }]}>勾選/金額</Text>
          <Text style={[styles.lastCell, { width: 100 }]}>備註</Text>
        </View>
        {draft.questions.map((question) => (
          <QuestionRow key={question.questionNo} question={question} />
        ))}
      </View>
    </Page>
  );
}
