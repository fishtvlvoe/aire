import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────────────────────
// Token types
// ─────────────────────────────────────────────────────────────────────────────

export interface PdfTokens {
  primary: string;
  text: string;
  textMuted: string;
  bg: string;
  bgAlt: string;
  border: string;
  fontFamily: string;
}

const THEME_TOKENS: Record<string, PdfTokens> = {
  "theme-a-minimal": {
    primary: "#3B82F6",
    text: "#111827",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F9FAFB",
    border: "#E5E7EB",
    fontFamily: "NotoSansTC",
  },
  "theme-b-professional": {
    primary: "#1E3A5F",
    text: "#1F2937",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F3F4F6",
    border: "#C9A961",
    fontFamily: "NotoSansTC",
  },
  "theme-c-tech-elegant": {
    primary: "#3B5E7A",
    text: "#1F2937",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F3F4F6",
    border: "#C9A961",
    fontFamily: "NotoSansTC",
  },
};

export function getThemePdfTokens(themeId: string): PdfTokens {
  return THEME_TOKENS[themeId] ?? THEME_TOKENS["theme-a-minimal"]!;
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfCover — 封面頁
// ─────────────────────────────────────────────────────────────────────────────

interface CoverDetail {
  propertyName: string;
  caseNumber: string;
  handlingAgent: string;
  licensedAgentName: string;
  licensedAgentCertNo: string;
  brokerageCompanyName: string;
  brokerageLicenseNo: string;
  companyAddress: string;
  companyPhone: string;
}

interface PdfCoverProps {
  tokens: PdfTokens;
  caseNo: string;
  clientName?: string;
  address?: string;
  propertyType?: string;
  companyName?: string;
  generatedAt: string;
  logoBytes?: number[];
  cover?: CoverDetail;
}

export function PdfCover({
  tokens,
  caseNo,
  clientName,
  address,
  propertyType,
  companyName,
  generatedAt,
  logoBytes,
  cover,
}: PdfCoverProps): React.ReactElement {
  const logoSrc = logoBytes
    ? `data:image/png;base64,${Buffer.from(logoBytes).toString("base64")}`
    : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        fontFamily: tokens.fontFamily,
      }}
    >
      {/* 頂部主色條 */}
      <View
        style={{
          backgroundColor: tokens.primary,
          height: 8,
        }}
      />

      {/* 主體內容 */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 48,
          paddingTop: 60,
          paddingBottom: 40,
          justifyContent: "space-between",
        }}
      >
        {/* 標題區 */}
        <View>
          {logoSrc && (
            <Image
              src={logoSrc}
              style={{ width: 80, height: 40, marginBottom: 24 }}
            />
          )}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: tokens.primary,
              marginBottom: 8,
            }}
          >
            不動產說明書
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: tokens.textMuted,
              marginBottom: 32,
            }}
          >
            {propertyType === "land" ? "土地版" : "建物版"}
          </Text>

          {/* 分隔線 */}
          <View
            style={{
              borderBottomWidth: 2,
              borderBottomColor: tokens.primary,
              borderBottomStyle: "solid",
              marginBottom: 32,
            }}
          />

          {/* 案件資訊 */}
          <View style={{ gap: 10 }}>
            <InfoRow label="物件名稱" value={cover?.propertyName ?? address ?? ""} tokens={tokens} />
            <InfoRow label="案件編號" value={cover?.caseNumber ?? caseNo} tokens={tokens} />
            <View style={{ height: 16 }} />
            <InfoRow label="承辦人" value={cover?.handlingAgent ?? ""} tokens={tokens} />
            <InfoRow label="經紀人" value={cover?.licensedAgentName ?? ""} tokens={tokens} />
            <InfoRow label="經紀人證號" value={cover?.licensedAgentCertNo ?? ""} tokens={tokens} />
            <View style={{ height: 16 }} />
            <InfoRow label="不動產經紀業" value={cover?.brokerageCompanyName ?? companyName ?? ""} tokens={tokens} />
            <InfoRow label="經紀業證號" value={cover?.brokerageLicenseNo ?? ""} tokens={tokens} />
            <InfoRow label="公司地址" value={cover?.companyAddress ?? ""} tokens={tokens} />
            <InfoRow label="公司電話" value={cover?.companyPhone ?? ""} tokens={tokens} />
          </View>
        </View>

        {/* 底部：製作日期 */}
        <Text
          style={{
            fontSize: 10,
            color: tokens.textMuted,
            textAlign: "right",
          }}
        >
          製作日期：{generatedAt}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: PdfTokens;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row" }}>
      <Text
        style={{
          width: 90,
          fontSize: 11,
          color: tokens.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontSize: 11,
          color: tokens.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfPageHeader — 頁首（每頁共用）
// ─────────────────────────────────────────────────────────────────────────────

interface PdfPageHeaderProps {
  tokens: PdfTokens;
  caseNo: string;
  pageNum?: number;
  totalPages?: number;
}

export function PdfPageHeader({
  tokens,
  caseNo,
  pageNum,
  totalPages,
}: PdfPageHeaderProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 8,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        borderBottomStyle: "solid",
        fontFamily: tokens.fontFamily,
      }}
    >
      <Text style={{ fontSize: 9, color: tokens.textMuted }}>
        不動產說明書｜{caseNo}
      </Text>
      {pageNum !== undefined && (
        <Text style={{ fontSize: 9, color: tokens.textMuted }}>
          {pageNum}
          {totalPages !== undefined ? ` / ${totalPages}` : ""}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfPageFooter — 頁尾
// ─────────────────────────────────────────────────────────────────────────────

interface PdfPageFooterProps {
  tokens: PdfTokens;
  generatedAt: string;
}

export function PdfPageFooter({
  tokens,
  generatedAt,
}: PdfPageFooterProps): React.ReactElement {
  return (
    <View
      style={{
        marginTop: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: tokens.border,
        borderTopStyle: "solid",
        fontFamily: tokens.fontFamily,
      }}
    >
      <Text style={{ fontSize: 8, color: tokens.textMuted, textAlign: "center" }}>
        本說明書依不動產經紀業管理條例及相關法規製作｜製作日期：{generatedAt}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfSection — 章節容器（標題 + children）
// ─────────────────────────────────────────────────────────────────────────────

interface PdfSectionProps {
  tokens: PdfTokens;
  title: string;
  children?: React.ReactNode;
}

export function PdfSection({
  tokens,
  title,
  children,
}: PdfSectionProps): React.ReactElement {
  return (
    <View style={{ marginBottom: 16, fontFamily: tokens.fontFamily }}>
      {/* 章節標題 */}
      <View
        style={{
          backgroundColor: tokens.bgAlt,
          paddingVertical: 6,
          paddingHorizontal: 10,
          marginBottom: 8,
          borderLeftWidth: 4,
          borderLeftColor: tokens.primary,
          borderLeftStyle: "solid",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: tokens.text,
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfFieldTable — 欄位/值兩欄表格
// ─────────────────────────────────────────────────────────────────────────────

interface PdfFieldTableProps {
  tokens: PdfTokens;
  rows: Array<[string, string]>;
}

const LABEL_WIDTH = 150;
const PENDING = "";

export function PdfFieldTable({
  tokens,
  rows,
}: PdfFieldTableProps): React.ReactElement {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: tokens.border,
        borderStyle: "solid",
        fontFamily: tokens.fontFamily,
      }}
    >
      {rows.map(([label, value], index) => {
        const displayValue = value === "" || value == null ? PENDING : value;
        const isEven = index % 2 === 0;

        return (
          <View
            key={index}
            style={{
              flexDirection: "row",
              borderBottomWidth: index < rows.length - 1 ? 1 : 0,
              borderBottomColor: tokens.border,
              borderBottomStyle: "solid",
            }}
          >
            {/* 欄位名稱（灰底） */}
            <View
              style={{
                width: LABEL_WIDTH,
                backgroundColor: tokens.bgAlt,
                paddingVertical: 5,
                paddingHorizontal: 8,
                borderRightWidth: 1,
                borderRightColor: tokens.border,
                borderRightStyle: "solid",
              }}
            >
              <Text style={{ fontSize: 10, color: tokens.textMuted }}>
                {label}
              </Text>
            </View>

            {/* 欄位值（白底） */}
            <View
              style={{
                flex: 1,
                backgroundColor: isEven ? tokens.bg : tokens.bg,
                paddingVertical: 5,
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color:
                    displayValue === PENDING ? tokens.textMuted : tokens.text,
                }}
              >
                {displayValue}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfSignatureBlock — 土地版簽章欄
// ─────────────────────────────────────────────────────────────────────────────

interface PdfSignatureBlockProps {
  tokens: PdfTokens;
}

const SIGNATURE_PARTIES = ["不動產經紀業", "經紀人", "買方", "賣方"] as const;

export function PdfSignatureBlock({
  tokens,
}: PdfSignatureBlockProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
      {SIGNATURE_PARTIES.map((party) => (
        <View
          key={party}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: tokens.border,
            borderStyle: "solid",
            paddingVertical: 8,
            paddingHorizontal: 6,
            minHeight: 90,
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: tokens.text,
              textAlign: "center",
            }}
          >
            {party}
          </Text>
          <View style={{ alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 60,
                borderBottomWidth: 1,
                borderBottomColor: tokens.textMuted,
                borderBottomStyle: "solid",
                height: 1,
              }}
            />
            <Text style={{ fontSize: 8.5, color: tokens.textMuted }}>
              日期：＿＿年＿＿月＿＿日
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
