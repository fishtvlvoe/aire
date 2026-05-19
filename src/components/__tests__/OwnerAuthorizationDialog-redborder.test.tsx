/**
 * TDD: Bug#3 Dialog 紅框
 * 未勾 checkbox 點確認 → border-red-500 + 錯誤文字
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OwnerAuthorizationDialog } from "../OwnerAuthorizationDialog";

vi.mock("@/lib/land-registry-api", () => ({
  recordConsent: vi.fn().mockResolvedValue(undefined),
}));

const defaultProps = {
  caseId: "11111111-1111-4111-8111-111111111111",
  open: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("OwnerAuthorizationDialog — Bug#3 紅框驗證", () => {
  it("確認按鈕預設啟用（不 disabled）", () => {
    render(<OwnerAuthorizationDialog {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /確認/ });
    expect(btn).not.toBeDisabled();
  });

  it("未勾 checkbox 點確認 → 顯示錯誤文字「請先勾選授權同意」", async () => {
    render(<OwnerAuthorizationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /確認/ }));
    await waitFor(() => {
      expect(screen.getByText("請先勾選授權同意")).toBeInTheDocument();
    });
  });

  it("未勾 checkbox 點確認 → checkbox wrapper 含 border-red-500 class", async () => {
    render(<OwnerAuthorizationDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /確認/ }));
    await waitFor(() => {
      const wrapper = document.querySelector(".border-red-500");
      expect(wrapper).not.toBeNull();
    });
  });

  it("勾選 checkbox 後錯誤狀態消失", async () => {
    render(<OwnerAuthorizationDialog {...defaultProps} />);
    // 先觸發錯誤
    fireEvent.click(screen.getByRole("button", { name: /確認/ }));
    await waitFor(() => screen.getByText("請先勾選授權同意"));
    // 勾選
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => {
      expect(screen.queryByText("請先勾選授權同意")).toBeNull();
      expect(document.querySelector(".border-red-500")).toBeNull();
    });
  });
});
