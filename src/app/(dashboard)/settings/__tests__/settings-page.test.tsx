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
    expect(screen.getByRole("button", { name: "授權與升級" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "地政資料規則" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "費用與帳務" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF 圖資欄位" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "地政授權" })).toBeInTheDocument();

    expect(screen.getByLabelText("Google 地圖未升級")).toBeDisabled();
    expect(screen.getByLabelText("地籍圖整理已開啟")).not.toBeDisabled();
    expect(screen.getByText("屋主資料邊界")).toBeInTheDocument();
    expect(screen.getByText("費用歸屬")).toBeInTheDocument();
    expect(screen.getByText("地政 API 設定")).toBeInTheDocument();
    expect(screen.getByText("實價登錄 MCP Hub")).toBeInTheDocument();
  });

  it("marks route-ready settings sections from query params", () => {
    mockSection = "billing";
    render(<SettingsPage />);

    expect(screen.getByRole("button", { name: "費用與帳務" })).toHaveClass("bg-slate-950");
  });
});
