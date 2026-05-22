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

  it("預設顯示個人設定", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "個人設定" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "帳號與授權管理" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "更新密碼" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "個人名稱與 Email" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "品牌色" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "目前操作紀錄" })).toBeInTheDocument();
  });

  it("設定頁不重複顯示頁內分類選單", async () => {
    render(<SettingsPage />);
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
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

  it("方案與升級顯示三方案且不出現工程名詞", async () => {
    mockSection = "plans";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "方案與升級" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本款" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "進階款" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "高級款" })).toBeInTheDocument();
    expect(screen.getByText("目前方案")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "前往升級" })).toHaveLength(2);
    expect(screen.getByLabelText("Google 地圖已開啟")).not.toBeDisabled();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.getByText("實價登錄")).toBeInTheDocument();
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
