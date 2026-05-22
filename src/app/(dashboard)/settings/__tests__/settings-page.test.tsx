import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SettingsPage from "../page";

let mockSection = "entitlements";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? mockSection : null),
  }),
}));

describe("SettingsPage demo alignment", () => {
  it("groups settings into demo categories and renders entitlement toggles", () => {
    mockSection = "entitlements";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "系統設定" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();

    expect(screen.getByLabelText("Google 地圖未升級")).toBeDisabled();
    expect(screen.getByLabelText("地籍圖整理已開啟")).not.toBeDisabled();
    expect(screen.queryByText("屋主資料邊界")).not.toBeInTheDocument();
    expect(screen.queryByText("費用歸屬")).not.toBeInTheDocument();
    expect(screen.queryByText("本月使用量")).not.toBeInTheDocument();
    expect(screen.queryByText("地政 API 設定")).not.toBeInTheDocument();
    expect(screen.getByText("實價登錄 MCP Hub")).toBeInTheDocument();
  });

  it("renders feature toggles once without customer-facing debug controls", () => {
    mockSection = "features";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "功能開關" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "授權與升級" })).toHaveLength(1);
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
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
    expect(screen.queryByText("授權與升級")).not.toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政 API 設定")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
  });
});
