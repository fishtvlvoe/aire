/**
 * ThemeProvider + useTheme + useSelectableTheme
 *
 * PTS-005：useTheme 在 ThemeProvider 外部呼叫時丟 ThemeError::ProviderMissing
 *
 * 支援兩種使用模式：
 *  - 舊：<ThemeProvider theme={pdfTheme}> 給 PDF blocks 使用
 *  - 新：<ThemeProvider initialThemeId="theme-a-minimal"> 給 UI selector 使用，
 *        透過 useSelectableTheme() 拿到 themeId / setThemeId / didFallback
 */

import { createContext, useContext, useState } from "react";
import type React from "react";
import type { PdfTheme } from "./types";
import { getTheme, resolveThemeOrFallback } from "./registry";
export { ThemeError, ThemeErrorCode } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const ThemeContext = createContext<PdfTheme | null>(null);

interface SelectableThemeContextValue {
  themeId: string;
  setThemeId: (id: string) => void;
  didFallback: boolean;
  requestedId: string;
}

const SelectableThemeContext = createContext<SelectableThemeContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider — 支援兩種 prop 模式
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeProvider(props: {
  theme?: PdfTheme;
  initialThemeId?: string;
  children: React.ReactNode;
}) {
  const { theme, initialThemeId, children } = props;

  if (initialThemeId !== undefined) {
    return (
      <SelectableThemeProviderImpl initialThemeId={initialThemeId}>
        {children}
      </SelectableThemeProviderImpl>
    );
  }

  if (!theme) {
    throw new Error(
      "<ThemeProvider> 必須提供 theme 或 initialThemeId 之一",
    );
  }

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

function SelectableThemeProviderImpl({
  initialThemeId,
  children,
}: {
  initialThemeId: string;
  children: React.ReactNode;
}) {
  const initialResolution = resolveThemeOrFallback(initialThemeId);
  const [themeId, setThemeIdState] = useState(initialResolution.theme.id);
  const [didFallback, setDidFallback] = useState(initialResolution.fellBack);
  const [requestedId, setRequestedId] = useState(initialThemeId);

  const setThemeId = (next: string) => {
    setRequestedId(next);
    const found = getTheme(next);
    if (found) {
      setThemeIdState(next);
      setDidFallback(false);
    } else {
      // unknown → 仍套 fallback 但顯示 banner
      setThemeIdState("theme-a-minimal");
      setDidFallback(true);
    }
  };

  const activeTheme = getTheme(themeId) ?? initialResolution.theme;

  return (
    <SelectableThemeContext.Provider
      value={{ themeId, setThemeId, didFallback, requestedId }}
    >
      <ThemeContext.Provider value={activeTheme}>
        {children}
      </ThemeContext.Provider>
    </SelectableThemeContext.Provider>
  );
}

export function useSelectableTheme(): SelectableThemeContextValue {
  const ctx = useContext(SelectableThemeContext);
  if (!ctx) {
    throw new Error(
      "useSelectableTheme() 必須在 <ThemeProvider initialThemeId=...> 內呼叫",
    );
  }
  return ctx;
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
