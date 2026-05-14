/**
 * Phase 2 紅燈測試 — ImportConflictDialog 元件
 *
 * 涵蓋失敗點：DEI-013 ~ DEI-018 (前端衝突處理 UI)
 * - 顯示衝突案件資訊
 * - 三個動作按鈕（覆蓋 / 保留較新 / 跳過）
 * - Apply to all checkbox
 * - 確認後呼叫正確的 callback
 *
 * 預期：所有測試 FAIL（元件不存在）= 紅燈
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 預期：這個 import 會失敗 = 紅燈（元件尚未存在）
import ImportConflictDialog from "@/components/ux/ImportConflictDialog";

const mockConflict = {
  caseId: 42,
  caseName: "測試不動產案件 A",
  existingUpdatedAt: "2024-01-01T00:00:00Z",
  incomingUpdatedAt: "2024-06-15T00:00:00Z",
  remainingCount: 3,
};

const defaultProps = {
  isOpen: true,
  conflict: mockConflict,
  onDecide: vi.fn(),
  onDecideAll: vi.fn(),
};

describe("ImportConflictDialog — DEI 衝突處理 UI 測試", () => {
  // DEI-013 UI: 顯示衝突案件資訊
  it("應顯示衝突案件的名稱和 ID", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    expect(screen.getByText(/測試不動產案件 A/)).toBeInTheDocument();
    expect(screen.getByText(/42|#42/)).toBeInTheDocument();
  });

  // DEI-013 UI: 提供「覆蓋」按鈕
  it("應包含「覆蓋」動作按鈕", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    const overwriteButton = screen.getByRole("button", { name: /覆蓋|overwrite/i });
    expect(overwriteButton).toBeInTheDocument();
    expect(overwriteButton).not.toBeDisabled();
  });

  // DEI-014 UI: 提供「保留較新」按鈕
  it("應包含「保留較新」動作按鈕", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    const keepNewerButton = screen.getByRole("button", { name: /保留較新|keep newer/i });
    expect(keepNewerButton).toBeInTheDocument();
    expect(keepNewerButton).not.toBeDisabled();
  });

  // DEI-015 UI: 提供「跳過」按鈕
  it("應包含「跳過」動作按鈕", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    const skipButton = screen.getByRole("button", { name: /跳過|skip/i });
    expect(skipButton).toBeInTheDocument();
    expect(skipButton).not.toBeDisabled();
  });

  // DEI-016 UI: 提供「套用至所有」checkbox 或按鈕
  it("應包含「套用至所有剩餘衝突」控制項", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    // 可能是 checkbox 或帶「all」的按鈕
    const applyAllControl = screen.queryByRole("checkbox", { name: /套用至所有|apply to all/i })
      || screen.queryByRole("button", { name: /套用.*所有|apply.*all/i });

    expect(applyAllControl).not.toBeNull();
  });

  // DEI-013 UI: 點擊「覆蓋」觸發正確 callback
  it("點擊「覆蓋」應呼叫 onDecide 並傳入 overwrite 策略", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(<ImportConflictDialog {...defaultProps} onDecide={onDecide} />);

    await user.click(screen.getByRole("button", { name: /覆蓋|overwrite/i }));

    expect(onDecide).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 42,
        strategy: "overwrite",
      })
    );
  });

  // DEI-015 UI: 點擊「跳過」觸發 onDecide 並傳入 skip 策略
  it("點擊「跳過」應呼叫 onDecide 並傳入 skip 策略", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(<ImportConflictDialog {...defaultProps} onDecide={onDecide} />);

    await user.click(screen.getByRole("button", { name: /跳過|skip/i }));

    expect(onDecide).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 42,
        strategy: "skip",
      })
    );
  });

  // DEI-016 UI: Apply to all → 觸發 onDecideAll callback
  it("啟用 Apply to all 後點擊任一策略應呼叫 onDecideAll", async () => {
    const user = userEvent.setup();
    const onDecideAll = vi.fn();
    render(<ImportConflictDialog {...defaultProps} onDecideAll={onDecideAll} />);

    // 先勾選 apply to all
    const applyAllControl = screen.getByRole("checkbox", { name: /套用至所有|apply to all/i });
    await user.click(applyAllControl);

    // 再選策略
    await user.click(screen.getByRole("button", { name: /覆蓋|overwrite/i }));

    expect(onDecideAll).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: "overwrite" })
    );
  });

  // DEI-017 UI: 顯示剩餘衝突數量
  it("應顯示剩餘衝突案件數量", () => {
    render(<ImportConflictDialog {...defaultProps} />);

    // mockConflict.remainingCount = 3
    expect(screen.getByText(/3.*衝突|3.*個/)).toBeInTheDocument();
  });
});
