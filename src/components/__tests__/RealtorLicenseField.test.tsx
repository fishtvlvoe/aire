/**
 * RealtorLicenseField 元件測試
 *
 * 涵蓋：
 *  RLV-001  500ms debounce — 快速輸入只觸發一次 IPC
 *  RLV-001b unmount 後 debounce timer 被清除
 *  RLV-003  三態 UI（verified / not_found / expired）
 *  RLV-005  驗證失敗不阻擋 form submit
 *  RLV-007  onVerificationChange callback 被正確呼叫
 *  RLV-009  離線 + 有 cache → 顯示最後驗證日期
 *  RLV-011  離線 + 無 cache → 顯示「離線中、無法驗證」
 *  RLV-015  空字串不觸發 IPC
 *
 * 技術備忘：
 *  - fake timers 環境下禁止 userEvent.type()（內部用真實 timer 會 hang）
 *  - 使用 vi.advanceTimersByTimeAsync() 同時推進 timer 並 flush microtasks（Promise 解析）
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

import {
  RealtorLicenseField,
  type LicenseVerificationState,
} from "../RealtorLicenseField";

// Mock Tauri IPC
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：模擬輸入 + 推進 debounce + flush Promise microtasks
// ─────────────────────────────────────────────────────────────────────────────
async function typeAndFlush(input: HTMLElement, value: string): Promise<void> {
  fireEvent.change(input, { target: { value } });
  // advanceTimersByTimeAsync 同時推進 fake timer 並 flush microtasks（Promise 解析）
  await vi.advanceTimersByTimeAsync(600);
}

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
// RLV-001 — 500ms debounce：快速輸入只觸發一次 IPC
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-001 — 500ms debounce: 快速輸入只觸發一次 IPC", () => {
  it("每次按鍵間隔 100ms，只在最後一次輸入後 500ms 發出一次 verify_realtor_license", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });

    // 模擬快速輸入（每 100ms 一個字元，每次都重置 debounce timer）
    let currentValue = "";
    for (const char of "ABC1234567") {
      currentValue += char;
      fireEvent.change(input, { target: { value: currentValue } });
      await vi.advanceTimersByTimeAsync(100);
    }

    // debounce 尚未到期
    expect(mockInvoke).not.toHaveBeenCalled();

    // 推進 500ms（最後一次輸入的 debounce 到期）
    await vi.advanceTimersByTimeAsync(500);

    // 只觸發一次
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith("verify_realtor_license", {
      licenseNumber: expect.any(String),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-001b — Unmount 後 debounce timer 清除
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-001b — Unmount 後不觸發 IPC", () => {
  it("元件 unmount 後 debounce 到期，不發 IPC", async () => {
    const mockInvoke = vi.mocked(invoke);

    const { unmount } = render(<RealtorLicenseField onChange={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    fireEvent.change(input, { target: { value: "ABC" } });

    // unmount 前 debounce 還沒到期
    unmount();

    // 推進 500ms
    await vi.advanceTimersByTimeAsync(600);

    // unmount 後不應觸發 IPC
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-003 — 三態 UI（verified / not_found / expired）
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-003 — 三態 UI 渲染", () => {
  it("verified：顯示「已驗證」文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "ABC1234567");

    await waitFor(() => {
      expect(screen.getByText(/已驗證/)).toBeInTheDocument();
    });
  });

  it("not_found：顯示「證號不存在」文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "not_found",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "INVALID999");

    await waitFor(() => {
      expect(screen.getByText(/證號不存在/)).toBeInTheDocument();
    });
  });

  it("expired：顯示「證號已過期」文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "expired",
      verified_at: "2025-01-01T00:00:00Z",
      source: "fresh",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "EXPIRED123");

    await waitFor(() => {
      expect(screen.getByText(/證號已過期/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-005 — 驗證狀態不阻擋 form submit
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-005 — 驗證失敗不阻擋 form submit", () => {
  it("expired 狀態下 form 仍可提交", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "expired",
      verified_at: "2025-01-01T00:00:00Z",
      source: "fresh",
    });

    const mockSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={mockSubmit}>
        <RealtorLicenseField onChange={vi.fn()} />
        <button type="submit">送出</button>
      </form>,
    );

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "EXPIRED123");

    await waitFor(() => {
      expect(screen.getByText(/證號已過期/)).toBeInTheDocument();
    });

    // expired 狀態下仍可按送出
    fireEvent.click(screen.getByRole("button", { name: /送出/i }));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("not_found 狀態下 form 仍可提交", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "not_found",
      source: "fresh",
    });

    const mockSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={mockSubmit}>
        <RealtorLicenseField onChange={vi.fn()} />
        <button type="submit">送出</button>
      </form>,
    );

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "NOTEXIST99");

    await waitFor(() => {
      expect(screen.getByText(/證號不存在/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /送出/i }));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-007 — onVerificationChange callback 被正確呼叫
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-007 — onVerificationChange callback", () => {
  it("verified 驗證結果正確傳出 LicenseVerificationState", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-14T10:00:00Z",
      source: "fresh",
    });

    const onVerificationChange = vi.fn<(state: LicenseVerificationState | null) => void>();

    render(<RealtorLicenseField onChange={vi.fn()} onVerificationChange={onVerificationChange} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "ABC1234567");

    await waitFor(() => {
      expect(onVerificationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "verified",
          source: "fresh",
        }),
      );
    });
  });

  it("清空輸入後 callback 以 null 呼叫", async () => {
    const onVerificationChange = vi.fn<(state: LicenseVerificationState | null) => void>();

    render(
      <RealtorLicenseField
        onChange={vi.fn()}
        onVerificationChange={onVerificationChange}
        initialValue="ABC1234567"
      />,
    );

    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    // 清空輸入（空字串不走 debounce，直接重置）
    fireEvent.change(input, { target: { value: "" } });
    await vi.advanceTimersByTimeAsync(100);

    // 清空不發 IPC，直接呼叫 null
    expect(onVerificationChange).toHaveBeenCalledWith(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-009 — 離線 + 有 cache → 顯示最後驗證日期
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-009 — 離線 + 有 cache", () => {
  it("顯示「已驗證（最後驗證日期 YYYY-MM-DD，目前離線中）」", async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({
      status: "verified",
      verified_at: "2026-05-01T10:00:00Z",
      source: "offline",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "OFFLINE123");

    await waitFor(() => {
      expect(screen.getByText(/目前離線中/)).toBeInTheDocument();
      expect(screen.getByText(/2026-05-01/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-011 — 離線 + 無 cache → 顯示「離線中、無法驗證」
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-011 — 離線 + 無 cache", () => {
  it("顯示「離線中、無法驗證」文字", async () => {
    const mockInvoke = vi.mocked(invoke);
    // offline + 無 verified_at（無 cache）
    mockInvoke.mockResolvedValue({
      status: "not_found",
      source: "offline",
    });

    render(<RealtorLicenseField onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });
    await typeAndFlush(input, "NOCACHE999");

    await waitFor(() => {
      expect(screen.getByText(/離線中、無法驗證/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RLV-015 — 空字串不發 IPC
// ─────────────────────────────────────────────────────────────────────────────
describe("RLV-015 — 空輸入不觸發 IPC", () => {
  it("清空輸入框後 debounce 到期，不發 IPC", async () => {
    const mockInvoke = vi.mocked(invoke);

    render(<RealtorLicenseField onChange={vi.fn()} initialValue="ABC123456" />);
    const input = screen.getByRole("textbox", { name: /經紀人證號/i });

    // 清空
    fireEvent.change(input, { target: { value: "" } });
    await vi.advanceTimersByTimeAsync(600);

    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
