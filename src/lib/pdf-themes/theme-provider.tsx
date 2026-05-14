/**
 * ThemeProvider + useTheme
 *
 * PTS-005：useTheme 在 ThemeProvider 外部呼叫時丟 ThemeError::ProviderMissing
 */

import { createContext, useContext } from "react";
import type React from "react";
import type { PdfTheme } from "./types";
export { ThemeError, ThemeErrorCode } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const ThemeContext = createContext<PdfTheme | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeProvider({
  theme,
  children,
}: {
  theme: PdfTheme;
  children: React.ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useTheme — 未在 Provider 內時丟 ThemeError::ProviderMissing
// ─────────────────────────────────────────────────────────────────────────────
import { ThemeError, ThemeErrorCode } from "./types";

export function useTheme(): PdfTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new ThemeError(
      ThemeErrorCode.ProviderMissing,
      "PdfTheme not found in context — wrap the document in <ThemeProvider>"
    );
  }
  return theme;
}
