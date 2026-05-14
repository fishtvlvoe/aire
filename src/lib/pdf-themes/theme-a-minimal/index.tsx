/**
 * 主題 A — 淡雅 Minimal
 *
 * 白底 #FFFFFF / 灰邊 #E5E7EB / 文字 #111827 / 強調 #3B82F6
 * 參考 mockups/pdf-themes/theme-a-minimal/cover.html
 */

import React from "react";
import type { PdfTheme } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Token 定義
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  primary: "#3B82F6",   // 藍色強調
  secondary: "#6B7280", // 灰色次要
  text: "#111827",      // 深色文字
  bgPrimary: "#FFFFFF", // 白底
  bgSecondary: "#F9FAFB", // 淺灰背景
  border: "#E5E7EB",   // 灰邊
  accent: "#3B82F6",   // 強調同 primary
};

// ─────────────────────────────────────────────────────────────────────────────
// 元件（React PDF 環境 — 不使用 View/Text，只用 div）
// 真實 PDF render 時由 pdf-engine 包裝，這裡回傳 React 元素供測試用
// ─────────────────────────────────────────────────────────────────────────────

const Cover: React.FC<{ caseData?: unknown; logo?: unknown }> = ({
  caseData,
  logo,
}) => (
  <div
    style={{
      backgroundColor: colors.bgPrimary,
      borderTop: `4px solid ${colors.primary}`,
      padding: "40px",
      position: "relative",
    }}
  >
    {logo && (
      <div style={{ marginBottom: "16px" }}>
        <img src={logo as string} alt="logo" style={{ maxHeight: "40px" }} />
      </div>
    )}
    <div
      style={{ color: colors.text, fontSize: "24px", fontWeight: "bold" }}
    >
      不動產說明書
    </div>
    <div style={{ color: colors.secondary, fontSize: "14px", marginTop: "8px" }}>
      REAL ESTATE INFORMATION
    </div>
    {caseData && (
      <pre style={{ fontSize: "10px", color: colors.secondary }}>
        {JSON.stringify(caseData)}
      </pre>
    )}
  </div>
);

const Header: React.FC<{ logo?: unknown }> = ({ logo }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${colors.border}`,
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
      borderTop: `1px solid ${colors.border}`,
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
      borderLeft: `3px solid ${colors.primary}`,
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
              backgroundColor: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              padding: "6px 8px",
              textAlign: "left",
              color: colors.text,
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
export const themeAMinimal: PdfTheme = {
  id: "theme-a-minimal",
  label: "淡雅 Minimal",
  displayName: "淡雅 Minimal",
  description: "白底灰邊，藍色強調，清爽極簡風格",
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

export default themeAMinimal;
