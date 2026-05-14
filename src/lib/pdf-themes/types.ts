import type React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeTokens — 視覺 token（PTS-002 expects primaryColor + fontFamily）
// ─────────────────────────────────────────────────────────────────────────────
export interface ThemeTokens {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  bgPrimary?: string;
  bgSecondary?: string;
  borderColor?: string;
  fontFamily: string;
  /** 補充 hex tokens 供外部查詢 */
  colors?: {
    primary: string;
    secondary: string;
    text: string;
    bgPrimary: string;
    bgSecondary: string;
    border: string;
    accent: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfThemeComponents — 五個必備元件（PTS-002 expects components.* properties）
// ─────────────────────────────────────────────────────────────────────────────
export interface PdfThemeComponents {
  Cover: React.ComponentType<{ caseData?: unknown; logo?: unknown }>;
  Header: React.ComponentType<{ logo?: unknown }>;
  Footer: React.ComponentType<Record<string, unknown>>;
  Section: React.ComponentType<{ children?: React.ReactNode }>;
  Table: React.ComponentType<{ rows?: unknown[]; columns?: unknown[] }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfTheme — 主題定義（測試用 components 物件格式）
// ─────────────────────────────────────────────────────────────────────────────
export interface PdfTheme {
  id: string;
  /** 顯示名稱（UI 用）*/
  label: string;
  displayName?: string;
  description?: string;
  version?: "1";
  components: PdfThemeComponents;
  tokens: ThemeTokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeError — 對應 PTS-005
// ─────────────────────────────────────────────────────────────────────────────
export enum ThemeErrorCode {
  ProviderMissing = "ProviderMissing",
  NotFound = "NotFound",
}

export class ThemeError extends Error {
  constructor(
    public code: ThemeErrorCode,
    message?: string
  ) {
    super(message ?? `ThemeError::${code}`);
    this.name = "ThemeError";
  }
}
