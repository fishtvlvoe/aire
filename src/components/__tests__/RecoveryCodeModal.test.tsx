/**
 * Phase 2 紅燈測試 — RecoveryCodeModal 元件
 *
 * 涵蓋失敗點：RCM-017 ~ RCM-023
 * - Modal 3 動作（Print / Download PDF / Checkbox 確認）
 * - Close 按鈕在 Checkbox 勾選前 disabled
 * - Escape 鍵被攔截（不能關閉 modal）
 * - Backdrop 點擊被攔截（不能關閉 modal）
 * - 3 動作完成後 Close 才可用
 *
 * 預期：所有測試 FAIL（元件不存在）= 紅燈
 * Phase 3 實作 RecoveryCodeModal 後才轉綠燈
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 預期：這個 import 會失敗 = 紅燈（元件尚未存在）
import RecoveryCodeModal from "@/components/ux/RecoveryCodeModal";

const MOCK_RECOVERY_WORDS = [
  "abandon", "ability", "able", "about",
  "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident",
];

const defaultProps = {
  isOpen: true,
  recoveryWords: MOCK_RECOVERY_WORDS,
  onClose: vi.fn(),
};

describe("RecoveryCodeModal — RCM-017 ~ RCM-023", () => {
  // RCM-017: Modal 顯示 12 個 BIP39 字
  it("RCM-017: 顯示 12 個 BIP39 救援碼字", () => {
    render(<RecoveryCodeModal {...defaultProps} />);

    // 12 個字應都顯示在 modal 中
    for (const word of MOCK_RECOVERY_WORDS) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  // RCM-018: Modal 提供 Print 動作
  it("RCM-018: Modal 包含 Print 按鈕", () => {
    render(<RecoveryCodeModal {...defaultProps} />);

    const printButton = screen.getByRole("button", { name: /列印|print/i });
    expect(printButton).toBeInTheDocument();
    expect(printButton).not.toBeDisabled();
  });

  // RCM-018b: Modal 提供 Download PDF 動作
  it("RCM-018b: Modal 包含下載 PDF 按鈕", () => {
    render(<RecoveryCodeModal {...defaultProps} />);

    const downloadButton = screen.getByRole("button", { name: /下載|download.*pdf/i });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();
  });

  // RCM-019: Close 按鈕在 Checkbox 勾選前必須是 disabled
  it("RCM-019: Close 按鈕在確認 Checkbox 勾選前應為 disabled", () => {
    render(<RecoveryCodeModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /關閉|close|完成|done/i });
    expect(closeButton).toBeDisabled();
  });

  // RCM-019b: Checkbox 勾選後 Close 按鈕應變為 enabled
  it("RCM-019b: 勾選確認 Checkbox 後 Close 按鈕應啟用", async () => {
    const user = userEvent.setup();
    render(<RecoveryCodeModal {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", {
      name: /我已.*儲存|已確認|我了解/i,
    });

    await user.click(checkbox);

    const closeButton = screen.getByRole("button", { name: /關閉|close|完成|done/i });
    expect(closeButton).not.toBeDisabled();
  });

  // RCM-020: Escape 鍵不能關閉 modal
  it("RCM-020: 按下 Escape 不應關閉 Modal", async () => {
    const onClose = vi.fn();
    render(<RecoveryCodeModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    // onClose 不應被呼叫
    expect(onClose).not.toHaveBeenCalled();
  });

  // RCM-021: Backdrop 點擊不能關閉 modal
  it("RCM-021: 點擊 Backdrop 不應關閉 Modal", async () => {
    const onClose = vi.fn();
    render(<RecoveryCodeModal {...defaultProps} onClose={onClose} />);

    // 點擊 modal 外部（backdrop）
    const backdrop = screen.getByTestId("recovery-modal-backdrop");
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  // RCM-022: Print 動作觸發 window.print()
  it("RCM-022: 點擊 Print 按鈕應呼叫 window.print()", async () => {
    const user = userEvent.setup();
    const mockPrint = vi.fn();
    vi.stubGlobal("print", mockPrint);

    render(<RecoveryCodeModal {...defaultProps} />);

    const printButton = screen.getByRole("button", { name: /列印|print/i });
    await user.click(printButton);

    expect(mockPrint).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  // RCM-023: Download PDF 動作觸發下載（invoke Tauri command）
  it("RCM-023: 點擊 Download PDF 應觸發下載動作", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.fn().mockResolvedValue(undefined);

    // Mock Tauri invoke
    vi.mock("@tauri-apps/api/core", () => ({
      invoke: mockInvoke,
    }));

    render(<RecoveryCodeModal {...defaultProps} />);

    const downloadButton = screen.getByRole("button", { name: /下載|download.*pdf/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "generate_recovery_pdf",
        expect.objectContaining({ words: MOCK_RECOVERY_WORDS })
      );
    });
  });
});
