/**
 * Phase 2 紅燈測試 — 設定 → 同步狀態頁
 *
 * LCS 同步狀態 UI：顯示各條法規版本日期 + 同步狀態 banner
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// ❌ 這個頁面元件還不存在 — 紅燈起點
import SyncStatusPage from "../page";

// Mock Tauri IPC
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SYNC_STATUS = {
  last_synced_at: "2026-05-14T10:00:00Z",
  clauses: [
    {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例",
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
    },
    {
      law_id: "consumer-protection-relevant",
      title: "消費者保護法相關條款",
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
    },
    {
      law_id: "fair-trade-relevant",
      title: "公平交易法相關條款",
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
    },
  ],
  sync_status: "ok" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// LCS / design: 同步狀態頁顯示三條法規版本日期
// 對應 design.md Decision 10（UX 互動模式）
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — Displays three law clause statuses", () => {
  it("頁面應顯示三條法規的名稱和版本日期", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue(MOCK_SYNC_STATUS);

    // ❌ SyncStatusPage 尚未實作 → import 失敗 = 紅燈
    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("不動產經紀業管理條例")).toBeInTheDocument();
      expect(screen.getByText("消費者保護法相關條款")).toBeInTheDocument();
      expect(screen.getByText("公平交易法相關條款")).toBeInTheDocument();
    });
  });

  it("版本日期應以中文格式顯示", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue(MOCK_SYNC_STATUS);

    render(<SyncStatusPage />);

    await waitFor(() => {
      // 應顯示中文日期格式（西元或民國）
      expect(screen.getByText(/2024.*08.*15/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LCS-007 / spec: OPCOS 離線時顯示 banner
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — Shows banner when OPCOS offline", () => {
  it("sync_status 為 fallback 時顯示「⚠ 法規同步失敗」banner", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      ...MOCK_SYNC_STATUS,
      sync_status: "fallback",
      fallback_days: 3,
    });

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/法規同步失敗/)).toBeInTheDocument();
      expect(screen.getByText(/3 天前/)).toBeInTheDocument();
    });
  });

  it("sync_status 為 empty_no_network 時顯示「無法連線取得法規資料」banner", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      last_synced_at: null,
      clauses: [],
      sync_status: "empty_no_network",
      fallback_days: null,
    });

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/無法連線取得法規資料/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LCS / design: 手動同步按鈕觸發 sync_legal_clauses IPC
// 對應 design.md Decision 10（UX：設定頁顯示警示）
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — Manual sync button", () => {
  it("點擊「立即同步」按鈕應呼叫 sync_legal_clauses IPC", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue(MOCK_SYNC_STATUS);

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /立即同步/i })).toBeInTheDocument();
    });

    const syncButton = screen.getByRole("button", { name: /立即同步/i });
    syncButton.click();

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("sync_legal_clauses");
    });
  });

  it("同步中狀態應禁用按鈕（防止重複點擊）", async () => {
    const mockInvoke = vi.mocked(invoke);
    // 第一次呼叫 get_sync_status 返回正常狀態
    // 第二次呼叫 sync_legal_clauses 慢慢 resolve
    mockInvoke
      .mockResolvedValueOnce(MOCK_SYNC_STATUS) // get_sync_status
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      ); // sync_legal_clauses（慢）

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /立即同步/i })).toBeInTheDocument();
    });

    const syncButton = screen.getByRole("button", { name: /立即同步/i });
    syncButton.click();

    // 同步中按鈕應 disabled
    await waitFor(() => {
      expect(syncButton).toBeDisabled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DDG / spec: 同步狀態頁的最後同步時間
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — Last sync timestamp display", () => {
  it("顯示最後同步時間（中文格式）", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      ...MOCK_SYNC_STATUS,
      last_synced_at: "2026-05-14T10:00:00Z",
    });

    render(<SyncStatusPage />);

    await waitFor(() => {
      // 應顯示「最後同步：YYYY 年 MM 月 DD 日」或類似格式
      expect(screen.getByText(/最後同步/)).toBeInTheDocument();
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });
  });
});
