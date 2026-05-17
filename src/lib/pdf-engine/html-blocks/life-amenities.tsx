import React, { CSSProperties } from "react";
import type { HtmlThemeTokens } from "../html-themes";
import { HtmlSection, HtmlPageHeader, HtmlPageFooter } from "../html-components";

export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

export interface HtmlLifeAmenitiesProps {
  tokens: HtmlThemeTokens;
  caseNo: string;
  generatedAt: string;
  nearbyAmenities?: NearbyAmenity[];
}

export function HtmlLifeAmenities({
  tokens,
  caseNo,
  generatedAt,
  nearbyAmenities = [],
}: HtmlLifeAmenitiesProps): React.ReactElement {
  const pageStyle: CSSProperties = {
    padding: "24px",
    paddingTop: "120px",
    fontFamily: tokens.fontFamily,
    backgroundColor: tokens.bg,
    color: tokens.text,
    minHeight: "297mm",
    boxSizing: "border-box",
  };

  const headingStyle: CSSProperties = {
    fontSize: "20px",
    marginBottom: "16px",
    color: tokens.primary,
    fontFamily: tokens.fontFamily,
  };

  const emptyStyle: CSSProperties = {
    color: tokens.textMuted,
    fontSize: "12px",
    fontFamily: tokens.fontFamily,
  };

  // 空資料狀態
  if (!nearbyAmenities || nearbyAmenities.length === 0) {
    return (
      <div style={pageStyle}>
        <HtmlPageHeader tokens={tokens} caseNo={caseNo} />
        <p style={headingStyle}>生活機能</p>
        <span style={emptyStyle}>尚未查詢周邊設施</span>
        <HtmlPageFooter tokens={tokens} generatedAt={generatedAt} />
      </div>
    );
  }

  // 按 category 分組
  const grouped = new Map<string, NearbyAmenity[]>();
  for (const amenity of nearbyAmenities) {
    const group = grouped.get(amenity.category) ?? [];
    group.push(amenity);
    grouped.set(amenity.category, group);
  }

  const categoryHeadingStyle: CSSProperties = {
    fontSize: "12px",
    fontWeight: "bold",
    color: tokens.primary,
    marginBottom: "4px",
    fontFamily: tokens.fontFamily,
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: `1px solid ${tokens.border}`,
    fontFamily: tokens.fontFamily,
    fontSize: "9px",
  };

  const cellBase: CSSProperties = {
    padding: "6px",
    color: tokens.text,
    fontSize: "9px",
    fontFamily: tokens.fontFamily,
    verticalAlign: "middle",
  };

  return (
    <div style={pageStyle}>
      <HtmlPageHeader tokens={tokens} caseNo={caseNo} />
      <p style={headingStyle}>生活機能</p>
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} style={{ marginBottom: "12px" }}>
          <p style={categoryHeadingStyle}>{category}</p>
          <table style={tableStyle}>
            <tbody>
              {items.map((item, index) => {
                const rowStyle: CSSProperties = {
                  borderBottom:
                    index === items.length - 1
                      ? "none"
                      : `1px solid ${tokens.border}`,
                };
                return (
                  <tr key={index} style={rowStyle}>
                    {/* 名稱：flex 2 ≈ 佔比 ~50% */}
                    <td style={{ ...cellBase, width: "50%" }}>{item.name}</td>
                    {/* 距離：固定 60px */}
                    <td style={{ ...cellBase, width: "60px", textAlign: "right" }}>
                      {Math.round(item.distanceM)} m
                    </td>
                    {/* 地址：flex 3 ≈ 剩餘空間 */}
                    <td style={{ ...cellBase }}>{item.address || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <HtmlPageFooter tokens={tokens} generatedAt={generatedAt} />
    </div>
  );
}
