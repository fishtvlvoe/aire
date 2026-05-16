import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/branding",
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockBrandingContent = () => <div>branding-content</div>;
    return MockBrandingContent;
  },
}));

import BrandingSettingsPage from "../page";

describe("Branding settings page", () => {
  it("renders settings tabs and marks branding active", () => {
    render(<BrandingSettingsPage />);

    expect(screen.getByRole("link", { name: "一般設定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "品牌設定" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "操作日誌" })).toBeInTheDocument();
  });
});
