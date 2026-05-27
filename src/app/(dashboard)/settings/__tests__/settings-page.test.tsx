import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPage from "../page";

let mockSection: string | null = "profile";

const mockFeatureFlags = [
  { id: "google-map", name: "Google 地圖", enabled: false },
  { id: "aerial-photo", name: "空拍圖", enabled: false },
  { id: "street-view-reference", name: "街景參考", enabled: false },
  { id: "ai-floor-plan", name: "AI 格局圖整理", enabled: false },
  { id: "cadastral-map", name: "地籍圖整理", enabled: false },
  { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
];

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? mockSection : null),
  }),
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(async (cmd: string) => {
    if (cmd === "get_session") {
      return {
        authenticated: true,
        user: { email: "admin@test.aire", role: "admin" },
      };
    }
    if (cmd === "get_feature_flags") return mockFeatureFlags;
    if (cmd === "get_profile_settings") {
      return {
        name: "余啟彰",
        email: "fish.myfb@gmail.com",
        brandColor: "#174d36",
        logoName: "",
        passwordUpdatedAt: null,
      };
    }
    if (cmd === "save_profile_settings") return { success: true };
    if (cmd === "update_profile_password") {
      return { success: true, passwordUpdatedAt: "2026-05-22T00:00:00.000Z" };
    }
    if (cmd === "get_land_api_settings") return { clientId: "", secret: "" };
    if (cmd === "toggle_feature_flag") return { success: true, enabled: true };
    return { success: true };
  }),
}));

vi.mock("@/lib/auth", () => ({
  getDeviceSessionStatus: vi.fn(async () => ({
    status: "active",
    email: "admin@test.aire",
    persistedAt: "2026-05-25T00:00:00.000Z",
  })),
}));

describe("SettingsPage demo alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders personal settings as the default landing page", () => {
    mockSection = "profile";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "個人設定" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PDF 開啟密碼" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "個人名稱與 Email" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "品牌色與 Logo" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("品牌色")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("品牌 Logo 上傳")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "帳號與授權管理" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "目前操作紀錄" })).not.toBeInTheDocument();
  });

  it("renders only the currently available basic plan", async () => {
    mockSection = "plans";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "方案設定" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本款" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "進階款" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "高級款" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "帳號與授權管理" })).toBeInTheDocument();
    expect(screen.getByText("帳號角色")).toBeInTheDocument();
    expect(await screen.findByText("管理員")).toBeInTheDocument();
    expect(screen.getAllByText("目前方案").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "前往升級" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "預留功能" })).not.toBeInTheDocument();
    expect(screen.queryByText("目前正在開發中。")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Google 地圖未啟用" })).not.toBeInTheDocument();
    expect(screen.queryByText("測試版已開啟")).not.toBeInTheDocument();
    expect(screen.queryByText(/正式版歸在/)).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄")).not.toBeInTheDocument();
  });

  it("marks route-ready settings sections from query params", () => {
    mockSection = "billing";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "費用紀錄" })).toBeInTheDocument();
    expect(screen.getByText("本月使用量")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "品牌設定" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "操作日誌" })).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政查詢帳號")).not.toBeInTheDocument();
  });

  it("renders registry source as land-data content instead of the full system settings", () => {
    mockSection = "registry-rules";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "資料來源" })).toBeInTheDocument();
    expect(screen.getByText("屋主資料邊界")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "品牌設定" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "操作日誌" })).not.toBeInTheDocument();
    expect(screen.queryByText("方案設定")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政查詢帳號")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
  });
});
