import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/settings";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { SettingsTabs } from "@/components/SettingsTabs";

describe("SettingsTabs", () => {
  it("renders three settings tabs with target routes", () => {
    mockPathname = "/settings";
    render(<SettingsTabs />);

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

  it("highlights active tab by current route", () => {
    mockPathname = "/settings";
    const { rerender } = render(<SettingsTabs />);
    expect(screen.getByRole("link", { name: "一般設定" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    mockPathname = "/settings/branding";
    rerender(<SettingsTabs />);
    expect(screen.getByRole("link", { name: "品牌設定" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    mockPathname = "/settings/logs";
    rerender(<SettingsTabs />);
    expect(screen.getByRole("link", { name: "操作日誌" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
