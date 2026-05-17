import type { CSSProperties, ReactNode } from "react";
import type { HtmlThemeTokens } from "./html-themes";

export interface CoverDetail {
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

interface HtmlCoverProps {
  tokens: HtmlThemeTokens;
  caseNo: string;
  address?: string;
  propertyType?: string;
  companyName?: string;
  generatedAt: string;
  cover?: CoverDetail;
}

interface HtmlPageHeaderProps {
  tokens: HtmlThemeTokens;
  caseNo: string;
  pageNum?: number;
  totalPages?: number;
}

interface HtmlPageFooterProps {
  tokens: HtmlThemeTokens;
  generatedAt: string;
}

interface HtmlSectionProps {
  tokens: HtmlThemeTokens;
  title: string;
  children: ReactNode;
}

interface HtmlFieldTableProps {
  tokens: HtmlThemeTokens;
  rows: Array<[string, string]>;
}

interface HtmlSignatureBlockProps {
  tokens: HtmlThemeTokens;
}

function baseTextStyle(tokens: HtmlThemeTokens): CSSProperties {
  return {
    color: tokens.text,
    fontFamily: tokens.fontFamily,
  };
}

function resolveCoverRows(
  caseNo: string,
  address: string | undefined,
  companyName: string | undefined,
  cover: CoverDetail | undefined,
): Array<[string, string]> {
  return [
    ["物件名稱", cover?.propertyName ?? address ?? ""],
    ["案件編號", cover?.caseNumber ?? caseNo],
    ["承辦人", cover?.handlingAgent ?? ""],
    ["經紀人", cover?.licensedAgentName ?? ""],
    ["經紀人證號", cover?.licensedAgentCertNo ?? ""],
    ["經紀業", cover?.brokerageCompanyName ?? companyName ?? ""],
    ["經紀業證號", cover?.brokerageLicenseNo ?? ""],
    ["公司地址", cover?.companyAddress ?? ""],
    ["公司電話", cover?.companyPhone ?? ""],
  ];
}

export function HtmlCover({
  tokens,
  caseNo,
  address,
  propertyType,
  companyName,
  generatedAt,
  cover,
}: HtmlCoverProps) {
  const rows = resolveCoverRows(caseNo, address, companyName, cover);

  const containerStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    backgroundColor: tokens.bg,
    boxSizing: "border-box",
    minHeight: "100%",
    padding: "0 42px 36px",
  };

  const topBarStyle: CSSProperties = {
    backgroundColor: tokens.primary,
    height: 8,
    margin: "0 -42px 44px",
  };

  const titleStyle: CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.25,
    margin: "0 0 10px",
    textAlign: "center",
  };

  const subtitleStyle: CSSProperties = {
    color: tokens.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 28,
    textAlign: "center",
  };

  const dividerStyle: CSSProperties = {
    borderTop: `1px solid ${tokens.border}`,
    marginBottom: 28,
  };

  const footerStyle: CSSProperties = {
    color: tokens.textMuted,
    fontSize: 11,
    lineHeight: 1.6,
    marginTop: 42,
    textAlign: "center",
  };

  return (
    <div style={containerStyle}>
      <div style={topBarStyle} />
      <div style={titleStyle}>不動產說明書</div>
      <div style={subtitleStyle}>{propertyType ? `${propertyType}版` : ""}</div>
      <div style={dividerStyle} />
      <HtmlFieldTable tokens={tokens} rows={rows} />
      <div style={footerStyle}>製作日期：{generatedAt}</div>
    </div>
  );
}

export function HtmlPageHeader({
  tokens,
  caseNo,
  pageNum,
  totalPages,
}: HtmlPageHeaderProps) {
  const pageText =
    pageNum === undefined
      ? ""
      : totalPages === undefined
        ? `${pageNum}`
        : `${pageNum} / ${totalPages}`;

  const containerStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    alignItems: "center",
    borderBottom: `1px solid ${tokens.border}`,
    boxSizing: "border-box",
    display: "flex",
    fontSize: 9,
    justifyContent: "space-between",
    lineHeight: 1.5,
    padding: "0 0 8px",
    width: "100%",
  };

  const rightStyle: CSSProperties = {
    color: tokens.textMuted,
    textAlign: "right",
  };

  return (
    <div style={containerStyle}>
      <span>不動產說明書｜{caseNo}</span>
      <span style={rightStyle}>{pageText}</span>
    </div>
  );
}

export function HtmlPageFooter({ tokens, generatedAt }: HtmlPageFooterProps) {
  const containerStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    borderTop: `1px solid ${tokens.border}`,
    boxSizing: "border-box",
    color: tokens.textMuted,
    fontSize: 8,
    lineHeight: 1.6,
    padding: "8px 0 0",
    textAlign: "center",
    width: "100%",
  };

  return (
    <div style={containerStyle}>
      本說明書依不動產經紀業管理條例及相關法規製作｜製作日期：{generatedAt}
    </div>
  );
}

export function HtmlSection({ tokens, title, children }: HtmlSectionProps) {
  const containerStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 18,
  };

  const titleStyle: CSSProperties = {
    alignItems: "center",
    backgroundColor: tokens.bgAlt,
    borderLeft: `4px solid ${tokens.primary}`,
    boxSizing: "border-box",
    display: "flex",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.5,
    marginBottom: 10,
    padding: "8px 10px",
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

export function HtmlFieldTable({ tokens, rows }: HtmlFieldTableProps) {
  const tableStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    borderCollapse: "collapse",
    fontSize: 10,
    lineHeight: 1.5,
    tableLayout: "fixed",
    width: "100%",
  };

  const labelStyle: CSSProperties = {
    backgroundColor: tokens.bgAlt,
    border: `1px solid ${tokens.border}`,
    boxSizing: "border-box",
    color: tokens.textMuted,
    fontWeight: 600,
    padding: "7px 9px",
    verticalAlign: "top",
    width: 150,
  };

  const valueStyle: CSSProperties = {
    border: `1px solid ${tokens.border}`,
    boxSizing: "border-box",
    color: tokens.text,
    padding: "7px 9px",
    verticalAlign: "top",
  };

  return (
    <table style={tableStyle}>
      <tbody>
        {rows.map(([label, value], index) => (
          <tr key={`${label}-${index}`}>
            <td style={labelStyle}>{label}</td>
            <td style={valueStyle}>{value ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HtmlSignatureBlock({ tokens }: HtmlSignatureBlockProps) {
  const labels = ["不動產經紀業", "經紀人", "買方", "賣方"];

  const containerStyle: CSSProperties = {
    ...baseTextStyle(tokens),
    display: "grid",
    fontSize: 10,
    gap: 10,
    gridTemplateColumns: "repeat(4, 1fr)",
    lineHeight: 1.5,
    width: "100%",
  };

  const boxStyle: CSSProperties = {
    border: `1px solid ${tokens.border}`,
    boxSizing: "border-box",
    minHeight: 112,
    padding: 10,
  };

  const labelStyle: CSSProperties = {
    color: tokens.text,
    fontWeight: 700,
    marginBottom: 32,
    textAlign: "center",
  };

  const lineStyle: CSSProperties = {
    borderTop: `1px solid ${tokens.border}`,
    color: tokens.textMuted,
    marginTop: 18,
    paddingTop: 5,
  };

  return (
    <div style={containerStyle}>
      {labels.map((label) => (
        <div key={label} style={boxStyle}>
          <div style={labelStyle}>{label}</div>
          <div style={lineStyle}>簽名：</div>
          <div style={lineStyle}>日期：</div>
        </div>
      ))}
    </div>
  );
}
