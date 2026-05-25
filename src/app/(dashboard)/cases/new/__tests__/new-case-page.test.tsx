import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useIpcErrorToast", () => ({
  useIpcErrorToast: () => ({ handleError: vi.fn() }),
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    create: vi.fn().mockResolvedValue({ id: "case-1" }),
  },
}));

vi.mock("@/lib/land-registry-api", () => ({
  addressLookup: vi.fn(),
  confirmCaseRegistryMatch: vi.fn().mockResolvedValue({ success: true }),
}));

import NewCasePage from "../page";
import { casesApi } from "@/lib/cases-api";
import { addressLookup, confirmCaseRegistryMatch } from "@/lib/land-registry-api";

const mockAddressLookup = vi.mocked(addressLookup);
const mockConfirmCaseRegistryMatch = vi.mocked(confirmCaseRegistryMatch);
const mockCreateCase = vi.mocked(casesApi.create);

describe("NewCasePage address-first flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 1 號",
        lot_number: "0001",
        building_number: "0001",
      },
    ]);
  });

  it("starts with address-first registry detection instead of property type selection", () => {
    render(<NewCasePage />);

    expect(screen.getByRole("heading", { name: "新增案件" })).toBeInTheDocument();
    expect(screen.getByLabelText("地址 *")).toBeInTheDocument();
    expect(screen.queryByText("物件類型")).not.toBeInTheDocument();
  });

  it("classifies address through registry lookup and only shows manual property type fallback when needed", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(mockAddressLookup).toHaveBeenCalledWith("宜蘭縣五結鄉協和村親河路二段 1 號");
    });
    expect(screen.getByText("已找到 1 筆土地、1 筆建物")).toBeInTheDocument();
    expect(screen.getByText("已自動補齊，請確認資料")).toBeInTheDocument();
    expect(screen.queryByLabelText("物件類型")).not.toBeInTheDocument();

    mockAddressLookup.mockResolvedValue([]);
    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
    });
  });

  it("keeps customer-facing address lookup copy free of implementation terms", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getAllByText("地址資料補齊").length).toBeGreaterThan(0);
    });
    expect(document.body.textContent ?? "").not.toMatch(
      /\b(R02|COP|API|Helper|adapter|parser|payload|JSON)\b|便民系統/,
    );
  });

  it("runs registry detection from the primary submit button before case creation", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號1樓" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(mockAddressLookup).toHaveBeenCalledWith("台南市永康區勝利街58巷4號1樓");
    });
    expect(mockCreateCase).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "建立案件" })).toBeInTheDocument();
  });

  it("persists address lookup provenance without terminal failed ownership when creating the case", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DC-1556-00700000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "",
      },
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
      },
      {
        parcel_id: "DC-1556-00167000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00167000",
      },
      {
        parcel_id: "DC-1556-00229000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00229000",
      },
      {
        parcel_id: "DC-1556-00230000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00230000",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.change(screen.getByLabelText("案件名稱（選填）"), {
      target: { value: "裕農路物調驗收" },
    });
    fireEvent.change(screen.getByLabelText("案件編號（選填）"), {
      target: { value: "AIRE-YUNONG-20260523" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "建立案件" })).toBeInTheDocument();
    });
    expect(screen.getByText("土地 1 筆 · 建物 4 筆")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalled();
    });
    expect(mockCreateCase).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "台南市東區裕農路288巷17號8樓之1",
        case_name: "裕農路物調驗收",
        case_no: "AIRE-YUNONG-20260523",
        land_lot_no: "00700000",
        land_registry_data: expect.objectContaining({
          schema: "aire.registry-provenance.v1",
          parcelId: "DC-1556-00700000",
          totalCost: 0,
          candidate_options: expect.arrayContaining([
            expect.objectContaining({ normalized_parcel_id: "DC-1556-00700000" }),
            expect.objectContaining({ normalized_parcel_id: "DC-1556-00165000" }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00167000",
              query_status: "candidate_data_available",
              summary_fields: expect.objectContaining({
                registeredAreaPing: 30.9,
                mainBuildingAreaPing: 22.8,
              }),
            }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00165000",
              query_status: "candidate_data_available",
              summary_fields: expect.objectContaining({
                registeredAreaPing: 31.25,
                mainBuildingAreaPing: 23.1,
                auxiliaryAreaPing: 2.1,
                commonAreaPing: 6.05,
                parkingAreaPing: 0,
              }),
            }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00229000",
              query_status: "failed",
              error_code: "COP312",
            }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00230000",
              query_status: "failed",
              error_code: "COP305",
            }),
          ]),
          inferred_reference: expect.objectContaining({
            target_unit: "8樓之1",
            basis: "same_suffix_vertical_stack",
            confidence: "high",
            source_units: ["8樓之1", "5樓之1"],
            estimated_fields: expect.objectContaining({
              registeredAreaPing: 31.25,
              mainBuildingAreaPing: 23.1,
              auxiliaryAreaPing: 2.1,
              commonAreaPing: 6.05,
              parkingAreaPing: 0,
              legalUse: "住家用",
              constructionDate: "083/10/18",
              material: "鋼筋混凝土造",
              ownershipScope: "全部 1/1",
              landOwnershipRatio: "91/10000",
            }),
          }),
          coordinate_source: expect.objectContaining({
            lat: 22.986314,
            lng: 120.22908,
            source: "candidate_reference",
          }),
        }),
      }),
    );
    expect(mockConfirmCaseRegistryMatch).toHaveBeenCalledWith({
      caseId: "case-1",
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00165000",
    });
    const createdPayload = mockCreateCase.mock.calls[0]?.[0];
    const entries = createdPayload?.land_registry_data?.entries;
    expect(entries).not.toHaveProperty("building_ownership");
  });

  it("shows manual fallback when registry returns multiple candidates", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0000",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0000",
      },
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0001",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByText("找到多筆候選地政資料，請人工確認土地或建物")).toBeInTheDocument();
    });
    expect(screen.getByText("請選擇正確資料")).toBeInTheDocument();
    expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
  });

  it("blocks case creation until registry fields are confirmed", async () => {
    mockAddressLookup.mockResolvedValue([]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "無法自動補齊地址" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("請先確認地段、地號");
    expect(mockCreateCase).not.toHaveBeenCalled();
  });
});
