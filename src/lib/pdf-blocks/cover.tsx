import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";

export interface CoverProps {
  caseData: Record<string, unknown>;
  logo?: string;
}

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

// 表格列：左欄標籤、右欄資料
function InfoRow({
  label,
  value,
  border,
  labelColor,
  textColor,
  isLast,
}: {
  label: string;
  value: string;
  border: string;
  labelColor: string;
  textColor: string;
  isLast?: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
        borderBottomColor: border,
      }}
    >
      <View
        style={{
          width: "35%",
          padding: 6,
          backgroundColor: "#F3F4F6",
          borderRightWidth: 1,
          borderRightStyle: "solid",
          borderRightColor: border,
        }}
      >
        <Text style={{ fontSize: 10, color: labelColor, fontFamily: "NotoSansTC" }}>{label}</Text>
      </View>
      <View style={{ width: "65%", padding: 6 }}>
        <Text style={{ fontSize: 10, color: textColor, fontFamily: "NotoSansTC" }}>{value}</Text>
      </View>
    </View>
  );
}

export function Cover({ caseData }: CoverProps): React.ReactElement {
  const theme = useTheme();
  const colors = theme.tokens.colors;
  const textColor = colors?.text ?? theme.tokens.textColor ?? "#111827";
  const primary = colors?.primary ?? theme.tokens.primaryColor ?? "#1D4ED8";
  const border = colors?.border ?? theme.tokens.borderColor ?? "#E5E7EB";
  const secondary = colors?.secondary ?? theme.tokens.secondaryColor ?? "#6B7280";

  // 從 caseData 取頂層欄位
  const caseNumber = toStringValue(caseData.caseNumber, "未提供");
  const propertyAddress = toStringValue(
    caseData.propertyAddress ?? caseData.address,
    "未提供"
  );
  const propertyType = toStringValue(caseData.propertyType, "");
  const subtitle = propertyType === "land" ? "土地版" : propertyType === "building" ? "建物版" : "建物版";

  // 從 caseData.cover 取承辦/經紀人/公司欄位
  const cover = (caseData.cover ?? {}) as Record<string, unknown>;
  const brokerageCompanyName = toStringValue(cover.brokerageCompanyName, "未填寫");
  const handlingAgent = toStringValue(cover.handlingAgent, "未填寫");
  const licensedAgentName = toStringValue(cover.licensedAgentName, "未填寫");
  const licensedAgentCertNo = toStringValue(cover.licensedAgentCertNo, "未填寫");
  const brokerageLicenseNo = toStringValue(cover.brokerageLicenseNo, "未填寫");
  const companyAddress = toStringValue(cover.companyAddress, "未填寫");
  const companyPhone = toStringValue(cover.companyPhone, "未填寫");

  // 製作日期
  const generatedAt = toStringValue(caseData.generatedAt, "");
  const dateLabel = generatedAt
    ? generatedAt.slice(0, 10).replace(/-/g, "/")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  return (
    <Page size="A4" style={{ padding: 56, fontFamily: "NotoSansTC" }}>
      {/* 大標題 */}
      <View style={{ alignItems: "center", marginTop: 48, marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 36,
            color: primary,
            fontWeight: 700,
            fontFamily: "NotoSansTC",
          }}
        >
          不動產說明書
        </Text>
      </View>

      {/* 副標題 */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            color: secondary,
            fontFamily: "NotoSansTC",
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* 分隔線 */}
      <View
        style={{
          borderBottomWidth: 2,
          borderBottomStyle: "solid",
          borderBottomColor: primary,
          marginBottom: 28,
        }}
      />

      {/* 基本資訊：案件編號、標的地址、不動產經紀業 */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Text style={{ width: 100, fontSize: 11, color: secondary, fontFamily: "NotoSansTC" }}>
            案件編號
          </Text>
          <Text style={{ fontSize: 11, color: textColor, fontFamily: "NotoSansTC" }}>
            {caseNumber}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Text style={{ width: 100, fontSize: 11, color: secondary, fontFamily: "NotoSansTC" }}>
            標的地址
          </Text>
          <Text style={{ fontSize: 11, color: textColor, fontFamily: "NotoSansTC", flex: 1 }}>
            {propertyAddress}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Text style={{ width: 100, fontSize: 11, color: secondary, fontFamily: "NotoSansTC" }}>
            不動產經紀業
          </Text>
          <Text style={{ fontSize: 11, color: textColor, fontFamily: "NotoSansTC" }}>
            {brokerageCompanyName}
          </Text>
        </View>
      </View>

      {/* 留白區（實體蓋章用） */}
      <View style={{ flex: 1 }} />

      {/* 承辦人/經紀人資訊表格 */}
      <View
        style={{
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: border,
          marginBottom: 20,
        }}
      >
        <InfoRow
          label="承辦業務員"
          value={handlingAgent}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="經紀人姓名"
          value={licensedAgentName}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="經紀人證書字號"
          value={licensedAgentCertNo}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="經紀業公司名稱"
          value={brokerageCompanyName}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="經紀業證照號碼"
          value={brokerageLicenseNo}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="公司地址"
          value={companyAddress}
          border={border}
          labelColor={secondary}
          textColor={textColor}
        />
        <InfoRow
          label="公司電話"
          value={companyPhone}
          border={border}
          labelColor={secondary}
          textColor={textColor}
          isLast
        />
      </View>

      {/* 底部：製作日期（右下角） */}
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 9, color: secondary, fontFamily: "NotoSansTC" }}>
          製作日期：{dateLabel}
        </Text>
      </View>
    </Page>
  );
}
