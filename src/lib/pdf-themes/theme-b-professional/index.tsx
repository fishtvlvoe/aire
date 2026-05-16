/**
 * 主題 B — 專業 Professional
 *
 * 深藍灰 #2C3E50 / 白底 #FFFFFF / 金邊 #C9A961 / 文字 #1F2937
 */

import React from "react";
import type { PdfTheme } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Token 定義
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  primary: "#2C3E50",   // 深藍灰
  secondary: "#4B5563", // 灰色次要
  text: "#1F2937",      // 深色文字
  bgPrimary: "#FFFFFF", // 白底
  bgSecondary: "#F3F4F6", // 淺灰背景
  border: "#C9A961",   // 金邊
  accent: "#C9A961",   // 金色強調
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
      backgroundColor: colors.primary,
      padding: "40px",
      position: "relative",
      color: "#FFFFFF",
    }}
  >
    <div
      style={{
        borderBottom: `2px solid ${colors.border}`,
        paddingBottom: "16px",
        marginBottom: "16px",
      }}
    >
      {logo && (
        <img src={logo as string} alt="logo" style={{ maxHeight: "40px" }} />
      )}
    </div>
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
      不動產說明書
    </div>
    <div style={{ fontSize: "14px", marginTop: "8px", opacity: 0.8 }}>
      REAL ESTATE INFORMATION
    </div>
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
export const themeBProfessional: PdfTheme = {
  id: "theme-b-professional",
  label: "專業沉穩 Professional",
  displayName: "專業沉穩 Professional",
  description: "深藍底色，金色邊框，專業沉穩風格",
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

export default themeBProfessional;
