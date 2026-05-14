import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface ConditionSurveyProps {
  caseData: Record<string, unknown>;
  logo?: string;
}

const RESIDENTIAL_LABELS = [
  "建物用途",
  "樓層",
  "構造",
  "建坪",
  "主要建材",
  "屋齡",
  "格局",
  "使用執照",
  "停車位",
  "管理費",
  "公共設施",
  "頂樓防水",
  "外牆",
  "室內裝修",
  "漏水狀況",
  "海砂屋",
  "輻射屋",
  "凶宅資訊",
  "瓦斯設備",
  "電力設備",
  "給水設備",
  "排水設備",
  "消防設備",
  "鄰近嫌惡設施",
  "建物現況備註",
  "管理規約",
  "專有部分",
  "共有部分",
  "增建情形",
  "其他揭露事項",
];

const LAND_LABELS = [
  "土地使用分區",
  "公告現值",
  "面積",
  "使用類別",
  "地目",
  "持分比例",
  "臨路寬度",
  "路寬",
  "地勢高低",
  "排水狀況",
  "使用限制",
  "法定空地",
  "建蔽率",
  "容積率",
  "是否套繪管制",
  "是否位於山坡地",
  "是否位於水源水質保護區",
  "是否位於土壤液化潛勢區",
  "是否位於活動斷層區",
  "有無土壤污染",
  "有無地下管線",
  "地籍圖重測",
  "地上物現況",
  "土地現況備註",
  "租賃狀況",
  "第三人占用",
  "通行權",
  "耕作權",
  "收益使用情形",
  "其他揭露事項",
];

function buildRows(caseType: "residential" | "land", requestedRows: number): string[] {
  const base = caseType === "land" ? LAND_LABELS : RESIDENTIAL_LABELS;
  const rows = [...base];
  while (rows.length < requestedRows) rows.push(`${caseType === "land" ? "土地" : "建物"}調查項目 ${rows.length + 1}`);
  return rows;
}

export function ConditionSurvey({ caseData, logo }: ConditionSurveyProps): React.ReactElement {
  const caseType = caseData.caseType === "land" ? "land" : "residential";
  const requestedRows = typeof caseData.surveyRows === "number" ? Math.max(caseData.surveyRows, 30) : 30;
  const rows = buildRows(caseType, requestedRows);
  const rowsPerPage = Math.ceil(rows.length / 5);
  const pages = Array.from({ length: 5 }, (_, index) => rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage));

  const { tokens } = useTheme();
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";

  return (
    <>
      {pages.map((pageRows, pageIndex) => (
        <Page key={`survey-${caseType}-${pageIndex}`} size="A4" style={{ padding: 24, paddingTop: 120 }} wrap>
          <PdfHeaderWithLogo logoDataUrl={typeof logo === "string" ? logo : undefined} />
          <Text style={{ fontSize: 18, color: headingColor, marginBottom: 12 }}>
            {caseType === "land" ? "土地現況調查表" : "建物現況調查表"}（第 {pageIndex + 1} 頁）
          </Text>
          <View
            fixed
            style={{
              flexDirection: "row",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor,
              marginBottom: 2,
              backgroundColor: "#F9FAFB",
            }}
          >
            <Text style={{ width: "42%", padding: 6, fontSize: 10, color: headingColor }}>項目</Text>
            <Text style={{ width: "18%", padding: 6, fontSize: 10, color: headingColor }}>狀態</Text>
            <Text style={{ width: "40%", padding: 6, fontSize: 10, color: headingColor }}>說明</Text>
          </View>
          <View style={{ marginTop: 26 }}>
            {pageRows.map((label) => (
              <View
                key={`${caseType}-${pageIndex}-${label}`}
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor,
                  marginTop: -1,
                }}
              >
                <Text style={{ width: "42%", padding: 6, fontSize: 9, color: textColor }}>{label}</Text>
                <Text style={{ width: "18%", padding: 6, fontSize: 9, color: textColor }}>未填寫</Text>
                <Text style={{ width: "40%", padding: 6, fontSize: 9, color: textColor }} />
              </View>
            ))}
          </View>
          <PageFooter />
        </Page>
      ))}
    </>
  );
}

