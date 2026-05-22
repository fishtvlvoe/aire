import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SettingsPage from "../page";

let mockSection: string | null = "profile";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? mockSection : null),
  }),
}));

describe("SettingsPage demo alignment", () => {
  it("renders personal settings as the default landing page", () => {
    mockSection = "profile";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "個人設定" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "帳號與授權管理" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "更新密碼" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "個人名稱與 Email" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "品牌色" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "目前操作紀錄" })).toBeInTheDocument();
  });

  it("renders plan cards and usable test-build feature controls", () => {
    mockSection = "plans";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "方案與升級" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本款" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "進階款" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "高級款" })).toBeInTheDocument();
    expect(screen.getByText("目前方案")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "前往升級" })).toHaveLength(2);
    expect(screen.getByLabelText("Google 地圖已開啟")).not.toBeDisabled();
    expect(screen.getByLabelText("地籍圖整理已開啟")).not.toBeDisabled();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.getByText("實價登錄")).toBeInTheDocument();
  });

  it("marks route-ready settings sections from query params", () => {
    mockSection = "billing";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "費用紀錄" })).toBeInTheDocument();
    expect(screen.getByText("本月使用量")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "品牌設定" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "操作日誌" })).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政 API 設定")).not.toBeInTheDocument();
  });

  it("renders registry source as land-data content instead of the full system settings", () => {
    mockSection = "registry-rules";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "資料來源" })).toBeInTheDocument();
    expect(screen.getByText("屋主資料邊界")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "品牌設定" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "操作日誌" })).not.toBeInTheDocument();
    expect(screen.queryByText("方案與升級")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政 API 設定")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
  });
});
