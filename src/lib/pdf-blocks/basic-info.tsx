import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface BasicInfoPageProps {
  caseData: Record<string, unknown>;
  logo?: string;
}

export function BasicInfoPage({ caseData, logo }: BasicInfoPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>基本資訊</Text>
      <View style={{ borderWidth: 1, borderStyle: "solid", borderColor }}>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: borderColor }}>
          <Text style={{ width: "30%", padding: 8, color: textColor }}>物件編號</Text>
          <Text style={{ width: "70%", padding: 8, color: textColor }}>{String(caseData.caseId ?? "")}</Text>
        </View>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: borderColor }}>
          <Text style={{ width: "30%", padding: 8, color: textColor }}>物件名稱</Text>
          <Text style={{ width: "70%", padding: 8, color: textColor }}>{String(caseData.propertyName ?? "未命名物件")}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ width: "30%", padding: 8, color: textColor }}>類型</Text>
          <Text style={{ width: "70%", padding: 8, color: textColor }}>{String(caseData.caseType ?? "")}</Text>
        </View>
      </View>
      <PageFooter />
    </Page>
  );
}

