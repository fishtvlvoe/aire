/**
 * 主題 C — 科技優雅 Tech Elegant
 *
 * 深藍 #3B5E7A / 粉漸層 / 金邊 #C9A961
 * 參考 mockups/pdf-themes/theme-c-tech-elegant/cover.html
 */

import React from "react";
import type { PdfTheme } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Token 定義
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  primary: "#3B5E7A",   // 深藍
  secondary: "#8B9CB3", // 淡藍灰次要
  text: "#1A2B3C",      // 深色文字
  bgPrimary: "#FFFFFF", // 白底
  bgSecondary: "#F0F4F8", // 淡藍灰背景
  border: "#C9A961",   // 金邊
  accent: "#C9A961",   // 金色強調
};

// 粉漸層橫條（裝飾用）
const gradientBarStyle: React.CSSProperties = {
  height: "4px",
  background: "linear-gradient(to right, #F9A8D4, #C084FC, #818CF8)",
  marginBottom: "16px",
};

// ─────────────────────────────────────────────────────────────────────────────
// 元件
// ─────────────────────────────────────────────────────────────────────────────

const Cover: React.FC<{ caseData?: Record<string, unknown>; logo?: string | null }> = ({
  caseData: _caseData,
  logo,
}) => (
  <div
    style={{
      backgroundColor: colors.bgPrimary,
      padding: "0",
      position: "relative",
    }}
  >
    {/* 粉漸層橫條 */}
    <div style={gradientBarStyle} />
    {/* 深藍頂部區 */}
    <div
      style={{
        backgroundColor: colors.primary,
        padding: "32px 40px 24px",
        color: "#FFFFFF",
      }}
    >
      {logo && (
        <img src={logo as string} alt="logo" style={{ maxHeight: "40px", marginBottom: "16px" }} />
      )}
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>
        不動產說明書
      </div>
      <div style={{ fontSize: "14px", marginTop: "8px", opacity: 0.8 }}>
        REAL ESTATE INFORMATION
      </div>
    </div>
    {/* 金線分隔 */}
    <div
      style={{
        height: "2px",
        backgroundColor: colors.border,
      }}
    />
    {/* 內容區 */}
    <div style={{ padding: "24px 40px" }} />
  </div>
);

const Header: React.FC<{ logo?: string | null }> = ({ logo }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `2px solid ${colors.border}`,
      paddingBottom: "8px",
    }}
  >
    {logo && (
      <img src={logo as string} alt="logo" style={{ maxHeight: "30px" }} />
    )}
    <div style={{ color: colors.secondary, fontSize: "10px" }}>
      不動產說明書
    </div>
  </div>
);

const Footer: React.FC = () => (
  <div
    style={{
      borderTop: `2px solid ${colors.border}`,
      paddingTop: "8px",
      color: colors.secondary,
      fontSize: "10px",
      textAlign: "center",
    }}
  >
    AIRE · AI 不動產說明書
  </div>
);

const Section: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      marginBottom: "16px",
      borderLeft: `3px solid ${colors.accent}`,
      paddingLeft: "12px",
    }}
  >
    {children}
  </div>
);

const Table: React.FC<{ rows?: unknown[]; columns?: unknown[] }> = ({
  rows = [],
  columns = [],
}) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "12px",
    }}
  >
    <thead>
      <tr>
        {(columns as string[]).map((col, i) => (
          <th
            key={i}
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
              border: `1px solid ${colors.border}`,
              padding: "6px 8px",
              textAlign: "left",
            }}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {(rows as string[][]).map((row, i) => (
        <tr key={i}>
          {(Array.isArray(row) ? row : [row]).map((cell, j) => (
            <td
              key={j}
              style={{
                border: `1px solid ${colors.border}`,
                padding: "6px 8px",
                color: colors.text,
              }}
            >
              {String(cell)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ─────────────────────────────────────────────────────────────────────────────
// 匯出主題定義
// ─────────────────────────────────────────────────────────────────────────────
export const themeCTechElegant: PdfTheme = {
  id: "theme-c-tech-elegant",
  label: "科技優雅 Tech Elegant",
  displayName: "科技優雅 Tech Elegant",
  description: "深藍底色，粉漸層裝飾，金色邊框，科技與優雅並存",
  version: "1",
  components: {
    Cover,
    Header,
    Footer,
    Section,
    Table,
  },
  tokens: {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    textColor: colors.text,
    bgPrimary: colors.bgPrimary,
    bgSecondary: colors.bgSecondary,
    borderColor: colors.border,
    fontFamily: "NotoSansTC",
    colors,
  },
};

export default themeCTechElegant;
