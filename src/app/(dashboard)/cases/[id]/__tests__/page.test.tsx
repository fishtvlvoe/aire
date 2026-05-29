import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockHandleError = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "_" }),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("caseId=case-1"),
}));

vi.mock("@/hooks/useIpcErrorToast", () => ({
  useIpcErrorToast: () => ({ handleError: mockHandleError }),
}));

vi.mock("@/components/workbench/DemoAlignedWorkbench", () => ({
  DemoAlignedWorkbench: () => <div data-testid="demo-aligned-workbench">workbench</div>,
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    get: vi.fn(),
  },
  formatTpeDate: vi.fn(() => "2026-05-29"),
  propertyTypeLabel: vi.fn(() => "成屋"),
  statusLabel: vi.fn(() => "草稿"),
}));

import CaseDetailPage from "../page";
import { casesApi } from "@/lib/cases-api";

const mockGet = vi.mocked(casesApi.get);

describe("CaseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a reference dossier banner when only free pre-survey data exists", async () => {
    mockGet.mockResolvedValue({
      id: "case-1",
      case_no: "AIRE-2026-001",
      case_name: "東和路案",
      property_type: "residential",
      land_lot_no: "東光段 00022132",
      land_lots: ["東光段 00022132"],
      building_lot_no: null,
      address: "台南市東區東和路47號3樓",
      owner_name: null,
      status: "draft",
      created_at: 1763200000,
      updated_at: 1763200000,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-29T00:00:00.000Z",
        isPaid: false,
        pricingNote: "免費前查：地址候選、附近實價登錄與參考欄位，不產生成本",
        totalCost: 0,
        entries: {
          land_registry: {
            apiId: "land_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: { lot_number: "00022132" },
          },
        },
      },
    });

    render(<CaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "案件資料狀態" })).toBeInTheDocument();
    });
    expect(screen.getByText("目前為參考版案件資料")).toBeInTheDocument();
    expect(screen.getByText("目前以免費前查或補件資料為主；若需要正式地政資料，可之後再進行付費正式查詢。")).toBeInTheDocument();
  });

  it("shows a formal dossier banner when trusted paid registry data exists", async () => {
    mockGet.mockResolvedValue({
      id: "case-1",
      case_no: "AIRE-2026-002",
      case_name: "勝利街案",
      property_type: "residential",
      land_lot_no: "兵南段 04080000",
      land_lots: ["兵南段 04080000"],
      building_lot_no: "00296000",
      address: "台南市永康區勝利街58巷4號",
      owner_name: "王小明",
      status: "draft",
      created_at: 1763200000,
      updated_at: 1763200000,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-29T00:00:00.000Z",
        isPaid: true,
        pricingNote: "付費正式查詢：已於執行前確認費用與授權，結果可作為正式地政資料來源",
        totalCost: 90,
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: { building_number: "00296000" },
          },
        },
      },
    });

    render(<CaseDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "案件資料狀態" })).toBeInTheDocument();
    });
    expect(screen.getByText("目前為正式版案件資料")).toBeInTheDocument();
    expect(screen.getByText("已寫入正式地政資料，可直接用於正式版 PDF 與後續說明書流程。")).toBeInTheDocument();
  });
});
