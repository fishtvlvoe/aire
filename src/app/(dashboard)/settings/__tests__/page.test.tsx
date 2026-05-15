import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock mockInvoke（所有子元件透過 mockInvoke 存取資料）
vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(async (cmd: string) => {
    if (cmd === "get_license_status") {
      return { status: "none", serial_key: null };
    }
    if (cmd === "get_land_api_settings") {
      return { clientId: "", secret: "" };
    }
    if (cmd === "get_premium_status") {
      return { subscribed: false, plan: null, expires_at: null };
    }
    if (cmd === "get_feature_flags") {
      return [
        { id: "premium-unlock", name: "Premium Unlock", enabled: false },
      ];
    }
    return { success: true };
  }),
}));

import SettingsPage from "../page";

describe("Settings page（重組後）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("顯示頁面標題「設定」", async () => {
    render(<SettingsPage />);
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("渲染授權管理區塊", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("授權管理")).toBeInTheDocument();
  });

  it("渲染地政 API 設定區塊", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("地政 API 設定")).toBeInTheDocument();
  });

  it("渲染實價登錄 MCP Hub 區塊", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("實價登錄 MCP Hub")).toBeInTheDocument();
  });

  it("DevSuperAdmin 在 test 環境不渲染（僅 development 環境可見）", () => {
    render(<SettingsPage />);
    // DevSuperAdmin 檢查 NODE_ENV === 'development'，test 環境不顯示
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });
});
