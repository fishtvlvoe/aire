/**
 * 主題 E — 溫暖 Warm
 *
 * 主色 #E67E22 / 米白背景 / 溫暖親切風格
 */

import React from "react";
import type { PdfTheme } from "../types";

const colors = {
  primary: "#E67E22",
  secondary: "#B86A23",
  text: "#4A2B12",
  bgPrimary: "#FFFFFF",
  bgSecondary: "#FFF3E8",
  border: "#F1C49A",
  accent: "#E67E22",
};

const Cover: React.FC<{ caseData?: Record<string, unknown>; logo?: string | null }> = ({
  caseData,
  logo,
}) => (
  <div
    style={{
      backgroundColor: colors.bgPrimary,
      borderTop: `4px solid ${colors.primary}`,
      padding: "40px",
      color: colors.text,
    }}
  >
    {logo && (
      <div style={{ marginBottom: "16px" }}>
        <img src={logo as string} alt="logo" style={{ maxHeight: "40px" }} />
      </div>
    )}
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>不動產說明書</div>
    <div style={{ fontSize: "14px", marginTop: "8px", color: colors.secondary }}>
      REAL ESTATE INFORMATION
    </div>
    {caseData && (
      <pre style={{ fontSize: "10px", color: colors.secondary }}>
        {JSON.stringify(caseData)}
      </pre>
    )}
  </div>
);

const Header: React.FC<{ logo?: string | null }> = ({ logo }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${colors.border}`,
      paddingBottom: "8px",
    }}
  >
    {logo && <img src={logo as string} alt="logo" style={{ maxHeight: "30px" }} />}
    <div style={{ color: colors.secondary, fontSize: "10px" }}>不動產說明書</div>
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
  <div style={{ marginBottom: "16px", borderLeft: `3px solid ${colors.accent}`, paddingLeft: "12px" }}>
    {children}
  </div>
);

const Table: React.FC<{ rows?: unknown[]; columns?: unknown[] }> = ({ rows = [], columns = [] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
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

export const themeEWarm: PdfTheme = {
  id: "theme-e-warm",
  label: "溫暖親切 Warm",
  displayName: "溫暖親切 Warm",
  description: "橘色暖調，親和直覺，適合服務導向風格",
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

export default themeEWarm;
