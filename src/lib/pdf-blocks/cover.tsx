import React from "react";
import { Image, Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PDF_LOGO_BOX_HEIGHT_MM, PDF_LOGO_BOX_WIDTH_MM } from "./logo-anchors";

export interface CoverProps {
  caseData: Record<string, unknown>;
  logo?: string;
}

function mmToPt(mm: number): number {
  return (mm / 25.4) * 72;
}

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export function Cover({ caseData, logo }: CoverProps): React.ReactElement {
  const theme = useTheme();
  const ThemedCover = theme.components.Cover;
  const colors = theme.tokens.colors;
  const textColor = colors?.text ?? theme.tokens.textColor ?? "#111827";
  const primary = colors?.primary ?? theme.tokens.primaryColor;
  const border = colors?.border ?? theme.tokens.borderColor ?? "#E5E7EB";
  const secondary = colors?.secondary ?? theme.tokens.secondaryColor ?? "#6B7280";

  const caseId = toStringValue(caseData.caseId, "未提供");
  const propertyName = toStringValue(caseData.propertyName, "未命名物件");
  const summaryRaw = Array.isArray(caseData.summary)
    ? caseData.summary
    : Array.isArray(caseData.highlights)
      ? caseData.highlights
      : [];
  const summary = summaryRaw
    .map((item) => toStringValue(item, ""))
    .filter((item) => item.length > 0)
    .slice(0, 10);
  while (summary.length < 10) {
    summary.push(`重點 ${summary.length + 1}`);
  }

  const agents = [
    toStringValue(caseData.agentName, "未填寫"),
    toStringValue(caseData.agentLicense, "未填寫"),
    toStringValue(caseData.agentPhone, "未填寫"),
    toStringValue(caseData.agentEmail, "未填寫"),
  ];

  const companyName = toStringValue(caseData.companyName, "未填寫公司資訊");
  const companyAddress = toStringValue(caseData.companyAddress, "未填寫地址");
  const companyPhone = toStringValue(caseData.companyPhone, "未填寫電話");

  const logoWidth = mmToPt(PDF_LOGO_BOX_WIDTH_MM);
  const logoHeight = mmToPt(PDF_LOGO_BOX_HEIGHT_MM);

  return (
    <Page size="A4" style={{ padding: 28 }}>
      <View
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: 700 }}>AI</Text>
      </View>

      <Text style={{ fontSize: 32, color: primary, fontWeight: 700, marginTop: 16 }}>不動產說明書</Text>
      <Text style={{ fontSize: 13, color: secondary, marginTop: 6, marginBottom: 16 }}>
        REAL ESTATE INFORMATION
      </Text>

      <View style={{ marginBottom: 10 }}>
        <Text style={{ color: secondary, fontSize: 10 }}>物件編號</Text>
        <Text style={{ color: textColor, fontSize: 12 }}>{caseId}</Text>
      </View>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: secondary, fontSize: 10 }}>物件名稱</Text>
        <Text style={{ color: textColor, fontSize: 14 }}>{propertyName}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        {summary.map((item, index) => (
          <Text key={`${item}-${index}`} style={{ color: textColor, fontSize: 10, marginBottom: 4 }}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>

      <View style={{ borderWidth: 1, borderStyle: "solid", borderColor: border, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: border }}>
          <Text style={{ width: "25%", padding: 6, fontSize: 10, color: secondary }}>經紀人姓名</Text>
          <Text style={{ width: "25%", padding: 6, fontSize: 10, color: secondary }}>證號</Text>
          <Text style={{ width: "25%", padding: 6, fontSize: 10, color: secondary }}>電話</Text>
          <Text style={{ width: "25%", padding: 6, fontSize: 10, color: secondary }}>Email</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          {agents.map((item, index) => (
            <Text key={`agent-cell-${index}`} style={{ width: "25%", padding: 6, fontSize: 10, color: textColor }}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 10, color: secondary }}>{companyName}</Text>
        <Text style={{ fontSize: 10, color: textColor }}>{companyAddress}</Text>
        <Text style={{ fontSize: 10, color: textColor }}>{companyPhone}</Text>
      </View>

      <View
        style={{
          width: logoWidth,
          height: logoHeight,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9FAFB",
          overflow: "hidden",
        }}
      >
        {logo ? (
          <Image
            src={logo}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <Text style={{ fontSize: 10, color: "#9CA3AF" }}>（未設定 LOGO）</Text>
        )}
      </View>

      <Text style={{ fontSize: 8, color: secondary, marginTop: 8 }}>
        Theme Cover: {ThemedCover.displayName ?? "Cover"}
      </Text>
    </Page>
  );
}
