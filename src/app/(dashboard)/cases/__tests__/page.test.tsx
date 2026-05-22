import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
  formatTpeDate: vi.fn(() => "2026-05-15"),
  propertyTypeLabel: vi.fn(() => "成屋"),
  statusLabel: vi.fn(() => "草稿"),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  NotInTauriError: class NotInTauriError extends Error {},
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/cases",
}));

import CasesPage from "../page";
import { casesApi } from "@/lib/cases-api";
import { NotInTauriError } from "@/lib/tauri-bridge";

const mockList = vi.mocked(casesApi.list);

describe("Cases page fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tauri-required message on NotInTauriError", async () => {
    mockList.mockRejectedValue(new NotInTauriError("not in tauri"));

    render(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    });
  });

  it("renders a demo-aligned case management surface with workbench entry", async () => {
    mockList.mockResolvedValue([
      {
        id: "case-1",
        case_no: "AIRE-2026-001",
        case_name: "和平東路案",
        property_type: "residential",
        land_lot_no: "大安段 100",
        land_lots: ["大安段 100"],
        building_lot_no: "建號 8",
        address: "台北市大安區和平東路一段 100 號",
        owner_name: "陳小美",
        status: "draft",
        created_at: 1763200000,
        updated_at: 1763200000,
      },
    ]);

    render(<CasesPage />);

    expect(await screen.findByRole("heading", { name: "案件管理" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "新增案件" })).toHaveAttribute("href", "/cases/new");
    expect(screen.getByText("案件總覽")).toBeInTheDocument();
    expect(screen.getByText("說明書工作台")).toBeInTheDocument();
    expect(screen.getByText("補件清單")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "開啟和平東路案工作台" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
