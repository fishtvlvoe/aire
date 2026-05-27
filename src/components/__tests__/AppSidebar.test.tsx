import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

let mockPathname = "/settings";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

import { AppSidebar } from "@/components/AppSidebar";

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/settings";
    mockSearchParams = new URLSearchParams();
  });

  it("renders demo-aligned folder navigation with only the active folder expanded", () => {
    mockPathname = "/cases";

    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "主要選單" });
    expect(within(navigation).getByText("案件管理")).toBeInTheDocument();
    expect(within(navigation).getByText("地政資料")).toBeInTheDocument();
    expect(within(navigation).getByText("系統設定")).toBeInTheDocument();
    expect(within(navigation).queryByText("產出文件")).not.toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "新增案件" })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "物件審核" })).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "PDF 預覽" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "列印與匯出" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "費用紀錄" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "授權與升級" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "功能開關" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "地政查詢" })).not.toBeInTheDocument();
  });

  it("expands a folder submenu when the user opens it", () => {
    mockPathname = "/cases";

    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "展開地政資料選單" }));

    const navigation = screen.getByRole("navigation", { name: "主要選單" });
    expect(within(navigation).getByRole("link", { name: "費用紀錄" })).toBeInTheDocument();
  });

  it("系統設定顯示品牌、操作日誌與方案設定入口", () => {
    mockPathname = "/settings";

    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "主要選單" });
    expect(within(navigation).queryByRole("link", { name: "個人設定" })).not.toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "品牌設定" })).toHaveAttribute(
      "href",
      "/settings/branding",
    );
    expect(within(navigation).getByRole("link", { name: "操作日誌" })).toHaveAttribute("href", "/settings/logs");
    expect(within(navigation).getByRole("link", { name: "方案設定" })).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "地政授權" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "功能開關" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "授權與升級" })).not.toBeInTheDocument();
  });

  it("query section 頁面只標亮對應的系統設定子項目", () => {
    mockPathname = "/settings";
    mockSearchParams = new URLSearchParams("section=plans");

    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    const navigation = screen.getByRole("navigation", { name: "主要選單" });
    const plans = within(navigation).getByRole("link", { name: "方案設定" });
    const delivery = within(navigation).getByRole("link", { name: "品牌設定" });

    expect(delivery).not.toHaveClass("bg-blue-50");
    expect(plans).toHaveClass("bg-blue-50");
  });

  it("shows a persistent profile settings entry instead of the old app version card", () => {
    render(<AppSidebar collapsed={false} onToggle={vi.fn()} userName="余啟彰" />);

    expect(screen.getByRole("link", { name: "個人設定 余啟彰" })).toBeInTheDocument();
    expect(screen.getAllByText("個人設定").length).toBeGreaterThan(0);
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
