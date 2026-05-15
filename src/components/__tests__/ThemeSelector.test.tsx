/**
 * Phase 2 紅燈測試 — ThemeSelector 主題切換 UI
 *
 * 對應 pdf-theme-system 規格：
 * - 顯示可用主題清單
 * - 選擇主題後觸發 setTheme
 * - 當前主題高亮顯示
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ❌ 這些元件還不存在 — 紅燈起點
import { ThemeSelector } from "../ThemeSelector";
import { ThemeProvider } from "../../lib/pdf-themes/theme-provider";

// Mock persistence 模組
vi.mock("../../lib/pdf-themes/persistence", () => ({
  setTheme: vi.fn().mockResolvedValue({
    success: true,
    themeId: "theme-c-tech-elegant",
    didFallback: false,
  }),
  loadPersistedTheme: vi.fn().mockResolvedValue("theme-a-minimal"),
  BRANDING_CHANGED_EVENT: "branding-changed",
}));

import { setTheme } from "../../lib/pdf-themes/persistence";
const mockSetTheme = vi.mocked(setTheme);

function renderWithProvider(initialTheme = "theme-a-minimal") {
  return render(
    <ThemeProvider initialThemeId={initialTheme}>
      <ThemeSelector />
    </ThemeProvider>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 顯示主題清單
// ─────────────────────────────────────────────────────────────────────────────
describe("ThemeSelector — displays available themes", () => {
  it("顯示 theme-a-minimal 選項", () => {
    renderWithProvider();
    expect(screen.getByText(/minimal/i)).toBeInTheDocument();
  });

  it("顯示 theme-c-tech-elegant 選項", () => {
    renderWithProvider();
    expect(screen.getByText(/tech elegant/i)).toBeInTheDocument();
  });

  it("當前主題有 active/selected 標記", () => {
    renderWithProvider("theme-a-minimal");
    const activeItem = screen.getByTestId("theme-item-theme-a-minimal");
    expect(activeItem).toHaveAttribute("aria-selected", "true");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 選擇主題
// ─────────────────────────────────────────────────────────────────────────────
describe("ThemeSelector — theme selection triggers setTheme", () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
    mockSetTheme.mockResolvedValue({
      success: true,
      themeId: "theme-c-tech-elegant",
      didFallback: false,
    });
  });

  it("點擊 theme-c-tech-elegant 呼叫 setTheme('theme-c-tech-elegant')", async () => {
    renderWithProvider("theme-a-minimal");

    const proItem = screen.getByTestId("theme-item-theme-c-tech-elegant");
    fireEvent.click(proItem);

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith("theme-c-tech-elegant");
    });
  });

  it("setTheme 呼叫後 UI 更新顯示新的 active 主題", async () => {
    renderWithProvider("theme-a-minimal");

    const proItem = screen.getByTestId("theme-item-theme-c-tech-elegant");
    fireEvent.click(proItem);

    await waitFor(() => {
      expect(proItem).toHaveAttribute("aria-selected", "true");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fallback banner（PTS-007）
// ─────────────────────────────────────────────────────────────────────────────
describe("ThemeSelector — shows fallback banner when unknown theme used", () => {
  it("初始 themeId 為未知時顯示 fallback banner", () => {
    renderWithProvider("unknown-theme-xyz");
    expect(screen.getByTestId("theme-fallback-banner")).toBeInTheDocument();
  });

  it("已知 themeId 不顯示 fallback banner", () => {
    renderWithProvider("theme-a-minimal");
    expect(screen.queryByTestId("theme-fallback-banner")).toBeNull();
  });
});
