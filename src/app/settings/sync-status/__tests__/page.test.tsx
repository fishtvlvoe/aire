/**
 * 同步狀態頁測試
 *
 * 驗證：三條法規表格顯示、三態 UI、立即同步按鈕行為
 * invoke 命令：list_legal_clauses（讀取）/ sync_legal_clauses（手動同步）
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import SyncStatusPage from "../page";

// Mock Tauri IPC
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 天前

const MOCK_CLAUSES = [
  {
    law_id: "real-estate-broker-act",
    title: "不動產經紀業管理條例",
    version_date: "2024-08-15",
    fetched_at: RECENT_DATE,
  },
  {
    law_id: "consumer-protection-relevant",
    title: "消費者保護法相關條款",
    version_date: "2024-08-15",
    fetched_at: RECENT_DATE,
  },
  {
    law_id: "fair-trade-relevant",
    title: "公平交易法相關條款",
    version_date: "2024-08-15",
    fetched_at: RECENT_DATE,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// 渲染三條法規
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — 顯示三條法規", () => {
  it("應顯示三條法規名稱", async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_CLAUSES);

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("不動產經紀業管理條例")).toBeInTheDocument();
      expect(screen.getByText("消費者保護法相關條款")).toBeInTheDocument();
      expect(screen.getByText("公平交易法相關條款")).toBeInTheDocument();
    });
  });

  it("版本日期應以中文格式顯示（民國雙年制）", async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_CLAUSES);

    render(<SyncStatusPage />);

    await waitFor(() => {
      // formatRocDate("2024-08-15") → 含「民國 113 年」和「2024 年」
      const cells = screen.getAllByText(/民國 113 年/);
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("應顯示同步時間（N 天前）", async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_CLAUSES);

    render(<SyncStatusPage />);

    await waitFor(() => {
      // 2 天前同步 → 顯示「2 天前」
      const daysCells = screen.getAllByText(/天前/);
      expect(daysCells.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("近期同步的法規應顯示已同步狀態 icon", async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_CLAUSES);

    render(<SyncStatusPage />);

    await waitFor(() => {
      const okLabels = screen.getAllByText("已同步");
      expect(okLabels.length).toBe(3);
    });
  });

  it("過期法規應顯示過期狀態", async () => {
    const STALE_DATE = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 天前
    vi.mocked(invoke).mockResolvedValue([
      { ...MOCK_CLAUSES[0], fetched_at: STALE_DATE },
    ]);

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("過期")).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 三態 UI
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — 三態 UI", () => {
  it("載入中應顯示 LoadingState（role=status）", () => {
    // 讓 invoke 永遠 pending
    vi.mocked(invoke).mockReturnValue(new Promise(() => {}));

    render(<SyncStatusPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/載入法規資料中/)).toBeInTheDocument();
  });

  it("空資料應顯示 EmptyState 提示文字", async () => {
    vi.mocked(invoke).mockResolvedValue([]);

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText("尚無法規資料")).toBeInTheDocument();
      expect(screen.getByText(/請確認網路連線後按「立即同步」/)).toBeInTheDocument();
    });
  });

  it("資料載入失敗應顯示 ErrorState", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("IPC timeout"));

    render(<SyncStatusPage />);

    await waitFor(() => {
      expect(screen.getByText(/IPC timeout/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 立即同步按鈕
// ─────────────────────────────────────────────────────────────────────────────
describe("SyncStatusPage — 立即同步按鈕", () => {
  it("點擊後應呼叫 sync_legal_clauses IPC", async () => {
    const user = userEvent.setup();
    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_CLAUSES) // list_legal_clauses（初始載入）
      .mockResolvedValueOnce(undefined)    // sync_legal_clauses
      .mockResolvedValueOnce(MOCK_CLAUSES); // list_legal_clauses（同步後刷新）

    render(<SyncStatusPage />);

    const btn = await screen.findByRole("button", { name: /立即同步/i });
    await user.click(btn);

    await waitFor(() => {
      expect(vi.mocked(invoke)).toHaveBeenCalledWith("sync_legal_clauses");
    });
  });

  it("同步中按鈕應 disabled（防重複點擊）", async () => {
    const user = userEvent.setup();
    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_CLAUSES) // list_legal_clauses
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 2000)), // sync（慢）
      );

    render(<SyncStatusPage />);

    const btn = await screen.findByRole("button", { name: /立即同步/i });
    await user.click(btn);

    // 同步中應 disabled
    await waitFor(() => {
      expect(btn).toBeDisabled();
    });
  });

  it("同步失敗應顯示錯誤 banner", async () => {
    const user = userEvent.setup();
    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_CLAUSES)     // list_legal_clauses
      .mockRejectedValueOnce(new Error("同步逾時")); // sync_legal_clauses 失敗

    render(<SyncStatusPage />);

    const btn = await screen.findByRole("button", { name: /立即同步/i });
    await user.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/同步失敗/)).toBeInTheDocument();
      expect(screen.getByText(/同步逾時/)).toBeInTheDocument();
    });
  });

  it("同步成功後表格資料應刷新", async () => {
    const user = userEvent.setup();
    const UPDATED_DATE = new Date(Date.now() - 1000).toISOString(); // 剛剛同步
    const UPDATED_CLAUSES = MOCK_CLAUSES.map((c) => ({
      ...c,
      fetched_at: UPDATED_DATE,
    }));

    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_CLAUSES)   // 初始載入
      .mockResolvedValueOnce(undefined)       // sync_legal_clauses
      .mockResolvedValueOnce(UPDATED_CLAUSES); // 刷新

    render(<SyncStatusPage />);

    const btn = await screen.findByRole("button", { name: /立即同步/i });
    await user.click(btn);

    await waitFor(() => {
      // 同步後資料刷新，invoke 應被呼叫 3 次
      expect(vi.mocked(invoke)).toHaveBeenCalledTimes(3);
    });
  });
});
