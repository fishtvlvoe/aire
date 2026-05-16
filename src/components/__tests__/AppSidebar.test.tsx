import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

import { AppSidebar } from "@/components/AppSidebar";

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders only two navigation items: cases and settings", () => {
    render(<AppSidebar collapsed={false} onToggle={vi.fn()} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(screen.getByRole("link", { name: "案件管理" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "設定" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "品牌設定" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "日誌" })).not.toBeInTheDocument();
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
