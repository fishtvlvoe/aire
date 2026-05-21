import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

import { AppSidebar } from "@/components/AppSidebar";

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders demo-aligned folder navigation with submenus", () => {
    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "主要選單" });
    expect(within(navigation).getByText("案件管理")).toBeInTheDocument();
    expect(within(navigation).getByText("地政資料")).toBeInTheDocument();
    expect(within(navigation).getByText("產出文件")).toBeInTheDocument();
    expect(within(navigation).getByText("系統設定")).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "說明書工作台" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "費用紀錄" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "授權與升級" })).toBeInTheDocument();
  });

  it("shows a persistent profile settings entry instead of the old app version card", () => {
    render(<AppSidebar collapsed={false} onToggle={vi.fn()} userName="余啟彰" />);

    expect(screen.getByRole("link", { name: "個人設定 余啟彰" })).toBeInTheDocument();
    expect(screen.getByText("個人設定")).toBeInTheDocument();
    expect(screen.queryByText("v0.1.0")).not.toBeInTheDocument();
  });

  it("supports collapsed mode and collapse toggle", () => {
    const onToggle = vi.fn();

    render(<AppSidebar collapsed onToggle={onToggle} />);

    expect(screen.queryByText("案件管理")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "展開側邊欄" });
    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(toggle).toBeInTheDocument();
  });
});
