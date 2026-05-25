import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";

let mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

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

vi.mock("@/lib/safe-invoke", () => ({
  safeInvoke: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/cases",
}));

import CasesPage from "../page";
import { casesApi } from "@/lib/cases-api";
import { NotInTauriError } from "@/lib/tauri-bridge";
import { safeInvoke } from "@/lib/safe-invoke";

const mockList = vi.mocked(casesApi.list);
const mockSafeInvoke = vi.mocked(safeInvoke);

describe("Cases page fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSafeInvoke.mockResolvedValue(null);
    mockSearchParams = new URLSearchParams();
  });

  it("renders tauri-required message on NotInTauriError", async () => {
    mockList.mockRejectedValue(new NotInTauriError("not in tauri"));

    render(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    });
  });

  it("renders case overview without duplicating sidebar navigation or primary actions", async () => {
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

    expect(await screen.findByRole("heading", { name: "案件總覽" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "新增案件" })).toHaveAttribute("href", "/cases/new");
    expect(screen.queryByRole("navigation", { name: "案件分類" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "開啟和平東路案工作台" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("changes main content scope for workbench and supplements views", async () => {
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
        owner_name: null,
        status: "draft",
        created_at: 1763200000,
        updated_at: 1763200000,
      },
    ]);

    mockSearchParams = new URLSearchParams("view=workbench");
    const { rerender } = render(<CasesPage />);

    expect(await screen.findByRole("heading", { name: "物件審核" })).toBeInTheDocument();
    expect(screen.getByText("請先選擇案件")).toBeInTheDocument();
    expect(screen.queryByText("全部案件")).not.toBeInTheDocument();

    mockSearchParams = new URLSearchParams("view=supplements");
    rerender(<CasesPage />);

    expect(await screen.findByRole("heading", { name: "補件清單" })).toBeInTheDocument();
    expect(screen.getByText(/只顯示目前需要補資料的案件/)).toBeInTheDocument();
    expect(screen.queryByText("全部案件")).not.toBeInTheDocument();
  });

  it("puts PDF preview and export on the case row actions", async () => {
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

    expect(await screen.findByRole("heading", { name: "案件總覽" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "開啟工作台" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "預覽 PDF" }));
    expect(mockPush).toHaveBeenCalledWith("/cases/_/preview?caseId=case-1");

    fireEvent.click(screen.getByRole("button", { name: "補件" }));
    expect(mockPush).toHaveBeenCalledWith("/cases/_?caseId=case-1&tab=supplements");

    fireEvent.click(screen.getByRole("button", { name: "匯出 PDF" }));
    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledWith("export_pdf", { caseId: "case-1" });
    });

    fireEvent.click(screen.getByText("和平東路案"));
    expect(mockPush).toHaveBeenCalledWith("/cases/_?caseId=case-1");
  });

  it("opens supplement list rows in the supplement workbench tab", async () => {
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
        owner_name: null,
        status: "draft",
        created_at: 1763200000,
        updated_at: 1763200000,
      },
    ]);

    mockSearchParams = new URLSearchParams("view=supplements");
    render(<CasesPage />);

    expect(await screen.findByRole("heading", { name: "補件清單" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("和平東路案"));
    expect(mockPush).toHaveBeenCalledWith("/cases/_?caseId=case-1&tab=supplements");
  });

  it("does not expose case-scoped or implementation labels on the cases page", async () => {
    mockList.mockResolvedValue([]);

    render(<CasesPage />);

    const main = await screen.findByRole("region", { name: "案件管理內容" });
    expect(within(main).queryByText("現場必問工作台")).not.toBeInTheDocument();
    expect(main.textContent).not.toMatch(/BASIC|pro|advanced|MOI_API_/);
  });
});
