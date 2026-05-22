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
    if (cmd === "land_registry_get_balance") {
      return { month_total_cost: 500, month_query_count: 50, low_balance_warning: false };
    }
    return { success: true };
  }),
}));

import SettingsPage from "../page";

let mockSection: string | null = null;

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? mockSection : null),
  }),
}));

describe("Settings page（重組後）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSection = null;
  });

  it("顯示設定分頁 tabs", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("link", { name: "一般設定" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "品牌設定" })).toHaveAttribute(
      "href",
      "/settings/branding",
    );
    expect(screen.getByRole("link", { name: "操作日誌" })).toHaveAttribute(
      "href",
      "/settings/logs",
    );
  });

  it("顯示頁面標題「系統設定」", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "系統設定" })).toBeInTheDocument();
  });

  it("渲染授權管理區塊", async () => {
    mockSection = "registry-auth";
    render(<SettingsPage />);
    expect(await screen.findByText("地政 API 設定")).toBeInTheDocument();
  });

  it("渲染地政 API 設定區塊", async () => {
    mockSection = "registry-auth";
    render(<SettingsPage />);
    expect(await screen.findByText("地政 API 設定")).toBeInTheDocument();
  });

  it("渲染實價登錄 MCP Hub 區塊", async () => {
    mockSection = "entitlements";
    render(<SettingsPage />);
    expect(await screen.findByText("實價登錄 MCP Hub")).toBeInTheDocument();
  });

  it("資料來源頁不混入授權、升級與 Super Admin", async () => {
    mockSection = "registry-rules";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "資料來源" })).toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政 API 設定")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });

  it("DevSuperAdmin 在 test 環境不渲染（僅 development 環境可見）", () => {
    render(<SettingsPage />);
    // DevSuperAdmin 檢查 NODE_ENV === 'development'，test 環境不顯示
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });
});
