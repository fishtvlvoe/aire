import React from "react";
import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";

import { initReactPdfEngine } from "@/lib/pdf-engine/react-pdf-init";
import type {
  HouseConditionSurveyDraft,
  HouseLivingFunctionDraft,
  HouseOwnershipNotesTemplate,
  HouseTaxNotesTemplate,
  SurveyQuestionDraft,
} from "./house-mvp";

export type HouseMvpPdfPagePayload =
  | {
      page: "condition_survey_highrise";
      payload: HouseConditionSurveyDraft;
    }
  | {
      page: "living_function";
      payload: HouseLivingFunctionDraft;
    }
  | {
      page: "ownership_notes";
      payload: HouseOwnershipNotesTemplate;
    }
  | {
      page: "tax_notes";
      payload: HouseTaxNotesTemplate;
    };

export interface HouseMvpPdfPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  generatedAt: string;
  pages: HouseMvpPdfPagePayload[];
}

const pageStyle = {
  paddingTop: 32,
  paddingBottom: 32,
  paddingHorizontal: 32,
  fontFamily: "NotoSansTC",
  fontSize: 9,
  lineHeight: 1.45,
  color: "#0f172a",
} as const;

const styles = {
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    paddingBottom: 8,
    marginBottom: 12,
  },
  company: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    fontSize: 8,
  },
  metaCell: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#0f172a",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    minHeight: 24,
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  lastCell: {
    padding: 4,
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#0f172a",
    marginRight: 3,
  },
  checkGroup: {
    flexDirection: "row",
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  writableLine: {
    minHeight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
  },
  mapBox: {
    minHeight: 260,
    borderWidth: 1,
    borderColor: "#0f172a",
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  noteBox: {
    borderWidth: 1,
    borderColor: "#0f172a",
    padding: 6,
    marginBottom: 8,
  },
} as const;

function getTitle(page: HouseMvpPdfPagePayload): string {
  if (page.page === "condition_survey_highrise") {
    return "肆、現況調查表";
  }

  if (page.page === "living_function") {
    return "生活機能";
  }

  return page.payload.title;
}

function mapSourceLabel(source: HouseLivingFunctionDraft["mapSource"]): string {
  if (source === "auto_generated") {
    return "地圖來源：系統自動產生";
  }

  if (source === "manual_override") {
    return "地圖來源：手動上傳覆蓋";
  }

  return "地圖來源：";
}

function Header({
  title,
  data,
}: {
  title: string;
  data: Pick<HouseMvpPdfPayload, "caseNo" | "caseName" | "companyName" | "generatedAt">;
}) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.company}>{data.companyName ?? ""}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaCell}>案號：{data.caseNo}</Text>
        <Text style={styles.metaCell}>物件名稱：{data.caseName}</Text>
        <Text style={styles.metaCell}>製表日期：{data.generatedAt}</Text>
      </View>
    </View>
  );
}

function CheckboxLabel({ label }: { label: string }) {
  return (
    <View style={styles.checkItem}>
      <View style={styles.checkbox} />
      <Text>{label}</Text>
    </View>
  );
}

function SurveyQuestionRow({ question }: { question: SurveyQuestionDraft }) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text style={[styles.cell, { width: 30, textAlign: "center" }]}>{question.questionNo}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{question.label}</Text>
      <View style={[styles.cell, { width: 92 }]}>
        {question.answerType === "amount" ? (
          <View style={styles.writableLine} />
        ) : (
          <View style={styles.checkGroup}>
            <CheckboxLabel label="是" />
            <CheckboxLabel label="否" />
          </View>
        )}
      </View>
      <View style={[styles.lastCell, { width: 118 }]}>
        <View style={styles.writableLine} />
      </View>
    </View>
  );
}

function ConditionSurveyPage({ payload }: { payload: HouseConditionSurveyDraft }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text>類型：{payload.propertyType}</Text>
        <Text>表單版本：{payload.formVersion}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.cell, { width: 30, textAlign: "center" }]}>項次</Text>
          <Text style={[styles.cell, { flex: 1 }]}>調查事項</Text>
          <Text style={[styles.cell, { width: 92 }]}>勾選/金額</Text>
          <Text style={[styles.lastCell, { width: 118 }]}>備註</Text>
        </View>
        {payload.questions.map((question) => (
          <SurveyQuestionRow key={question.questionNo} question={question} />
        ))}
      </View>
    </View>
  );
}

function LivingFunctionPage({ payload }: { payload: HouseLivingFunctionDraft }) {
  const facilities =
    payload.facilities.length > 0
      ? payload.facilities
      : Array.from({ length: 6 }, (_, index) => ({
          index: index + 1,
          category: "",
          name: "",
          distanceM: "",
        }));

  return (
    <View>
      <View style={styles.mapBox} />
      <View style={{ gap: 4, marginBottom: 10 }}>
        <Text>地址：{payload.addressText}</Text>
        <Text>
          座標：
          {payload.latitude === null || payload.longitude === null ? "" : `${payload.latitude}, ${payload.longitude}`}
        </Text>
        <Text>{mapSourceLabel(payload.mapSource)}</Text>
        <Text style={{ color: "#475569" }}>自動產生失敗時可手動上傳覆蓋</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, { width: 30, textAlign: "center" }]}>項次</Text>
          <Text style={[styles.cell, { width: 100 }]}>類別</Text>
          <Text style={[styles.cell, { flex: 1 }]}>設施名稱</Text>
          <Text style={[styles.lastCell, { width: 70 }]}>距離</Text>
        </View>
        {facilities.map((facility) => (
          <View key={facility.index} style={styles.tableRow}>
            <Text style={[styles.cell, { width: 30, textAlign: "center" }]}>{facility.index}</Text>
            <Text style={[styles.cell, { width: 100 }]}>{facility.category}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{facility.name}</Text>
            <Text style={[styles.lastCell, { width: 70 }]}>{facility.distanceM}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OwnershipNotesPage({ payload }: { payload: HouseOwnershipNotesTemplate }) {
  return (
    <View style={{ gap: 7 }}>
      {payload.clauses.map((clause) => (
        <View key={clause.key} style={{ flexDirection: "row", gap: 6 }} wrap={false}>
          <Text style={{ width: 18 }}>{clause.index}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>{clause.topic}</Text>
            <Text>{clause.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TaxNotesPage({ payload }: { payload: HouseTaxNotesTemplate }) {
  return (
    <View>
      <Text style={styles.noteBox}>{payload.estimateCaveat}</Text>
      <View style={{ gap: 7 }}>
        {payload.notes.map((note) => (
          <View key={note.key} style={{ flexDirection: "row", gap: 6 }} wrap={false}>
            <Text style={{ width: 18 }}>{note.index}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 700 }}>{note.topic}</Text>
              <Text>{note.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PageBody({ page }: { page: HouseMvpPdfPagePayload }) {
  if (page.page === "condition_survey_highrise") {
    return <ConditionSurveyPage payload={page.payload} />;
  }

  if (page.page === "living_function") {
    return <LivingFunctionPage payload={page.payload} />;
  }

  if (page.page === "ownership_notes") {
    return <OwnershipNotesPage payload={page.payload} />;
  }

  return <TaxNotesPage payload={page.payload} />;
}

export function HouseMvpPdfDocument({ data }: { data: HouseMvpPdfPayload }): React.ReactElement {
  return (
    <Document>
      {data.pages.map((page, index) => (
        <Page key={`${page.page}-${index}`} size="A4" style={pageStyle}>
          <Header title={getTitle(page)} data={data} />
          <PageBody page={page} />
        </Page>
      ))}
    </Document>
  );
}

export async function renderHouseMvpDisclosurePdf(data: HouseMvpPdfPayload): Promise<Blob> {
  initReactPdfEngine();
  // @react-pdf's public pdf() type is narrower than React 19's element type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(<HouseMvpPdfDocument data={data} /> as any).toBlob();
  return blob;
}
