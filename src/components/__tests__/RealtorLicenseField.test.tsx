/**
 * Phase 2 紅燈測試 — RealtorLicenseField 元件
 *
 * RLV-001 ~ RLV-015 對應的前端 UI 行為
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  RealtorLicenseField,
  type RealtorLicenseFieldProps,
  type LicenseVerificationState,
} from "../RealtorLicenseField";

// Mock Tauri IPC
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-001 / spec: 快速輸入只觸發一次 API（debounce 500ms）
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-001 — 500ms debounce: rapid typing triggers one API call", () => {
  it("每個按鍵間隔 100ms 的快速輸入，只發一次 verify_realtor_license IPC", async () => {
    // ❌ RealtorLicenseField 尚未實作 → import 失敗 = 紅燈
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });

    // 模擬快速輸入（每 100ms 一個字元）
    for (const char of "ABC1234567") {
      fireEvent.change(input, { target: { value: input.getAttribute("value") + char } });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
    }

    // 此時 debounce timer 還沒到
    expect(mockInvoke).not.toHaveBeenCalled();

    // 推進 500ms（debounce 到期）
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // 恰好觸發一次
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith("verify_realtor_license", {
      licenseNumber: expect.any(String),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-003 / spec: 三態 UI 顯示
// 對應失敗矩陣 RLV-003：初始 idle 態 vs verified 態
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-003 — Three-state UI rendering", () => {
  it("verified 狀態顯示 CheckCircle icon 和『✓ 已驗證』文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "ABC1234567");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      // 應顯示「✓ 已驗證」
      expect(screen.getByText(/已驗證/)).toBeInTheDocument();
    });
  });

  it("not_found 狀態顯示 XCircle icon 和『✗ 證號不存在』文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "not_found",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "INVALID999");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText(/證號不存在/)).toBeInTheDocument();
    });
  });

  it("expired 狀態顯示 AlertTriangle icon 和『⚠ 證號已過期』文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "expired",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "EXPIRED123");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText(/證號已過期/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-001 / spec: cleanup on unmount
// 對應失敗矩陣 RLV-001：debounce timer 在 unmount 後未清除
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-001 — Debounce cleanup on unmount", () => {
  it("元件 unmount 後 debounce timer 被清除，不觸發 IPC", async () => {
    const mockInvoke = vi.mocked(invoke);

    const { unmount } = render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "ABC");

    // unmount 前 debounce 還沒到期
    unmount();

    // 推進 500ms（debounce 到期）
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // unmount 後不應觸發 IPC
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-015 / spec: 空字串不發送 API
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-015 — Empty input does not trigger API", () => {
  it("清空輸入框後 debounce 到期，不發 IPC", async () => {
    const mockInvoke = vi.mocked(invoke);

    render(<RealtorLicenseField onChange={vi.fn()} initialValue="ABC123456" />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });

    // 清空
    await userEvent.clear(input);

    // debounce 到期
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // 空字串不應觸發 IPC
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-009 / spec: 離線時顯示最後驗證日期
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-009 — Offline state with cache shows last verified date", () => {
  it("離線 + 有 cache 時顯示「✓ 已驗證（最後驗證日期 YYYY-MM-DD，目前離線中）」", async () => {
    const mockInvoke = vi.mocked(invoke);
    // IPC 返回 offline 狀態，附帶 cache 結果
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-01T10:00:00Z",
      source: "offline",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "OFFLINE123");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      // 應顯示離線提示 + 最後驗證日期
      expect(screen.getByText(/目前離線中/)).toBeInTheDocument();
      expect(screen.getByText(/2026-05-01/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-005 / spec: form submit 不被驗證狀態阻擋
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-005 — Verification state does not block form submit", () => {
  it("expired 狀態時 form 仍可提交", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "expired",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    const mockSubmit = vi.fn();

    render(
      <form onSubmit={mockSubmit}>
        <RealtorLicenseField onChange={vi.fn()} />
        <button type="submit">送出</button>
      </form>
    );

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await userEvent.type(input, "EXPIRED123");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText(/證號已過期/)).toBeInTheDocument();
    });

    // expired 狀態下仍可按送出
    fireEvent.click(screen.getByRole("button", { name: /送出/i }));

    expect(mockSubmit).toHaveBeenCalled();
  });
});
