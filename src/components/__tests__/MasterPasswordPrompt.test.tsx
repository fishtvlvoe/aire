/**
 * Phase 2 紅燈測試 — MasterPasswordPrompt 元件
 *
 * 涵蓋失敗點：MPKD-009 (密碼長度), MPKD-010 (密碼 zeroize UI 行為)
 * - 少於 8 code points 顯示錯誤
 * - 輸入框清除後值歸零
 * - 連結到救援碼恢復頁面
 *
 * 預期：所有測試 FAIL（元件不存在）= 紅燈
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 預期：這個 import 會失敗 = 紅燈（元件尚未存在）
import MasterPasswordPrompt from "@/components/ux/MasterPasswordPrompt";

const defaultProps = {
  onUnlock: vi.fn().mockResolvedValue(undefined),
};

describe("MasterPasswordPrompt — MPKD 相關 UI 測試", () => {
  // MPKD-009 UI: 輸入少於 8 code points 應顯示錯誤訊息
  it("輸入少於 8 code points 的密碼應顯示錯誤", async () => {
    const user = userEvent.setup();
    render(<MasterPasswordPrompt {...defaultProps} />);

    const input = screen.getByRole("textbox", { name: /主密碼|master password/i }) as HTMLInputElement
      || screen.getByPlaceholderText(/輸入主密碼|enter master password/i) as HTMLInputElement;

    // 輸入 7 個 code points
    await user.type(input, "abc1234");
    await user.click(screen.getByRole("button", { name: /解鎖|unlock/i }));

    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toHaveTextContent(/至少 8|密碼太短|too short/i);
  });

  // MPKD-010 UI: 提交失敗後密碼輸入框應清空（防止密碼在 DOM 停留）
  it("解鎖失敗後密碼輸入框應自動清空", async () => {
    const user = userEvent.setup();
    const failingUnlock = vi.fn().mockRejectedValue(new Error("Invalid password"));
    render(<MasterPasswordPrompt onUnlock={failingUnlock} />);

    const input = screen.getByPlaceholderText(/輸入主密碼|enter master password/i) as HTMLInputElement;
    await user.type(input, "wrong-password-here");

    await user.click(screen.getByRole("button", { name: /解鎖|unlock/i }));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  // 救援碼連結存在
  it("頁面應包含「用救援碼恢復」連結或按鈕", () => {
    render(<MasterPasswordPrompt {...defaultProps} />);

    const recoveryLink = screen.getByRole("button", { name: /救援碼|recovery code/i })
      || screen.getByRole("link", { name: /救援碼|recovery code/i });

    expect(recoveryLink).toBeInTheDocument();
  });

  // 密碼輸入框型別應為 password（不明文顯示）
  it("密碼輸入框 type 應為 password", () => {
    render(<MasterPasswordPrompt {...defaultProps} />);

    // 使用 querySelector 因為 type=password 不被 getByRole 查到
    const inputs = document.querySelectorAll("input");
    const passwordInput = Array.from(inputs).find(i => i.type === "password");

    expect(passwordInput).not.toBeUndefined();
  });
});
