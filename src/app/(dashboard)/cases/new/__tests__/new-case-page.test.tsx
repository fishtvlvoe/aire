import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationMocks.push }),
}));

vi.mock("@/hooks/useIpcErrorToast", () => ({
  useIpcErrorToast: () => ({ handleError: vi.fn() }),
}));

vi.mock("@/lib/cases-api", () => ({
  coarseCasePropertyType: (value: string) =>
    [
      "land",
      "farmland",
      "residential-land",
      "industrial-land",
      "commercial-land",
      "village-land",
      "other-land",
    ].includes(value)
      ? "land"
      : "residential",
  isCasePropertyType: (value: string) =>
    [
      "residential",
      "land",
      "farmland",
      "townhouse",
      "apartment",
      "highrise",
      "residential-land",
      "farmhouse",
      "studio",
      "storefront",
      "factory",
      "industrial-land",
      "commercial-land",
      "village-land",
      "other-land",
      "other",
    ].includes(value),
  casesApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: "case-1" }),
  },
}));

vi.mock("@/lib/land-registry-api", () => ({
  addressLookup: vi.fn(),
  confirmCaseRegistryMatch: vi.fn().mockResolvedValue({ success: true }),
  listRegistryQueryRuns: vi.fn().mockResolvedValue([]),
  paidAddressResolver: vi.fn(),
}));

vi.mock("@/lib/safe-invoke", () => ({
  safeInvoke: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/real-price-query", () => ({
  extractRealPriceDistrict: vi.fn((address: string) => {
    if (address.includes("永康區")) return "永康區";
    if (address.includes("東區")) return "東區";
    if (address.includes("萬華區")) return "萬華區";
    return "";
  }),
  extractRealPriceKeyword: vi.fn((address: string) => {
    if (address.includes("勝利街")) return "勝利街";
    if (address.includes("東和路")) return "東和路";
    if (address.includes("漢中街")) return "漢中街";
    return "";
  }),
  queryRealPrice: vi.fn().mockResolvedValue([]),
}));

import NewCasePage from "../page";
import { casesApi } from "@/lib/cases-api";
import { addressLookup, confirmCaseRegistryMatch, listRegistryQueryRuns, paidAddressResolver } from "@/lib/land-registry-api";
import { safeInvoke } from "@/lib/safe-invoke";
import { queryRealPrice } from "@/lib/real-price-query";

const mockAddressLookup = vi.mocked(addressLookup);
const mockConfirmCaseRegistryMatch = vi.mocked(confirmCaseRegistryMatch);
const mockListRegistryQueryRuns = vi.mocked(listRegistryQueryRuns);
const mockPaidAddressResolver = vi.mocked(paidAddressResolver);
const mockSafeInvoke = vi.mocked(safeInvoke);
const mockQueryRealPrice = vi.mocked(queryRealPrice);
const mockListCases = vi.mocked(casesApi.list);
const mockCreateCase = vi.mocked(casesApi.create);
const forbiddenCustomerTerms = /\b(R02|COP|API|Helper|adapter|parser|payload|JSON|sourceRunId)\b|便民系統/;

function expectCustomerCopyOnly() {
  expect(document.body.textContent ?? "").not.toMatch(forbiddenCustomerTerms);
}

describe("NewCasePage address-first flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCases.mockResolvedValue([]);
    mockSafeInvoke.mockResolvedValue([]);
    mockQueryRealPrice.mockResolvedValue([]);
    mockListRegistryQueryRuns.mockResolvedValue([]);
    mockPaidAddressResolver.mockResolvedValue({
      run_id: "resolver-run-001",
      total_cost: 30,
      total_cost_cents: 3000,
      cache_hit: false,
      source_run_id: null,
      candidates: [
        {
          parcel_id: "resolver:1556:00700000:00165000",
          address: "台南市東區裕農路288巷17號8樓之1",
          lot_number: "00700000",
          building_number: "00165000",
          section_name: "富強段",
          section_code: "1556",
          source: "cop_moi",
          trusted_for_pdf: false,
        },
        {
          parcel_id: "resolver:1556:00700000:00167000",
          address: "台南市東區裕農路288巷17號8樓之1",
          lot_number: "00700000",
          building_number: "00167000",
          section_name: "富強段",
          section_code: "1556",
          source: "cop_moi",
          trusted_for_pdf: false,
        },
      ],
    });
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 1 號",
        lot_number: "0001",
        building_number: "0001",
        source: "cop_moi",
        trusted_for_pdf: true,
        lat: 22.986314,
        lng: 120.22908,
      },
    ]);
  });

  it("starts with address-first registry detection instead of property type selection", () => {
    render(<NewCasePage />);

    expect(screen.getByRole("heading", { name: "新增案件" })).toBeInTheDocument();
    expect(screen.getByLabelText("地址 *")).toBeInTheDocument();
    expect(screen.queryByText("物件類型")).not.toBeInTheDocument();
    expect(screen.getByText("先用免費前查補齊地址候選、附近實價登錄與參考欄位；只有需要正式地政資料時才進入付費查詢。")).toBeInTheDocument();
    expect(screen.getByText("建議不要留空白或多餘符號；系統會自動判讀全形 / 半形、中文 / 阿拉伯數字。")).toBeInTheDocument();
  });

  it("classifies address through registry lookup and keeps property type editable", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(mockAddressLookup).toHaveBeenCalledWith("宜蘭縣五結鄉協和村親河路二段 1 號");
    });
    expect(screen.getByText("已找到 1 筆土地、1 筆建物")).toBeInTheDocument();
    expect(screen.getByText("已自動補齊，請確認資料")).toBeInTheDocument();
    expect(screen.getByLabelText("物件類型")).toHaveValue("residential");
    expect(screen.getByRole("option", { name: "大樓" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "公寓" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "透天" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "店面" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "工廠" })).toBeInTheDocument();

    mockAddressLookup.mockResolvedValue([]);
    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
    });
  });

  it("submits a backend-compatible property type and preserves the user-corrected detailed type", async () => {
    mockQueryRealPrice.mockResolvedValueOnce([
      {
        address: "宜蘭縣五結鄉親河路二段1號",
        type: "住宅大樓",
        area: 30,
        total_price: 9000000,
        unit_price: 300000,
        transaction_date: "2026-05-01",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區東和路47號3樓" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("物件類型")).toHaveValue("residential");
    });
    fireEvent.change(screen.getByLabelText("物件類型"), { target: { value: "storefront" } });
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          property_type: "residential",
          land_registry_data: expect.objectContaining({
            customer_property_type: "storefront",
            isPaid: false,
            pricingNote: "免費前查：地址候選、附近實價登錄與參考欄位，不產生成本",
            entries: expect.objectContaining({
              real_price_query: expect.objectContaining({
                source: "public_candidate",
                status: "candidate",
                trustedForPdf: false,
                data: expect.arrayContaining([
                  expect.objectContaining({
                    address: "宜蘭縣五結鄉親河路二段1號",
                    unit_price: 300000,
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });
  });

  it("shows query progress instead of creating progress while the first address lookup is still running", async () => {
    let resolveLookup: (value: []) => void = () => {};
    mockAddressLookup.mockReturnValueOnce(new Promise((resolve) => {
      resolveLookup = resolve;
    }));
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "查詢中..." })).toBeDisabled();
    });
    expect(screen.queryByRole("button", { name: "建立中…" })).not.toBeInTheDocument();

    await act(async () => {
      resolveLookup([]);
    });
  });

  it("shows the IPC error message instead of object text when case creation fails", async () => {
    mockCreateCase.mockRejectedValueOnce({
      code: "invalid_property_type",
      message: "property_type 必須為 residential 或 land",
    });
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("物件類型")).toHaveValue("residential");
    });
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("property_type 必須為 residential 或 land");
    });
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
  });

  it("offers paid resolver only after zero-cost discovery fails and keeps returned candidates unconfirmed", async () => {
    mockAddressLookup.mockResolvedValue([]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "我同意付費查詢建號" })).toBeInTheDocument();
    });
    expect(mockPaidAddressResolver).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "我同意付費查詢建號" }));

    await waitFor(() => {
      expect(mockPaidAddressResolver).toHaveBeenCalledWith("台南市東區裕農路288巷17號8樓之1");
      expect(screen.getByRole("radiogroup", { name: "候選物件資料" })).toBeInTheDocument();
    });
    expect(screen.getByRole("radio", { name: "建號 00165000 / 地號 00700000" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "建號 00167000 / 地號 00700000" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));
    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          land_registry_data: expect.objectContaining({
            registry_status: "registry_pending",
          }),
        }),
      );
    });
    expect(mockConfirmCaseRegistryMatch).not.toHaveBeenCalled();
  });

  it("auto-fills EasyMap R02 section, land number, and building number for confirmation", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DK-9125-00084000",
        address: "臺南市永康區勝利里２７鄰勝利街５８巷４號",
        section_name: "兵南段",
        section_code: "9125",
        land_office: "DK",
        lot_number: "04140000",
        building_number: "00084000",
        source: "easymap_r02",
        trusted_for_pdf: false,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("地段")).toHaveValue("兵南段");
    });
    expect(screen.getByLabelText("地號")).toHaveValue("04140000");
    expect(screen.getByLabelText("建號")).toHaveValue("00084000");
    expect(screen.getByLabelText("物件類型")).toHaveValue("residential");
  });

  it("auto-fills EasyMap Z10Web candidates instead of treating them as lookup failures", async () => {
    mockQueryRealPrice.mockResolvedValueOnce([
      {
        address: "台南市永康區勝利街58巷6號",
        type: "住宅大樓",
        area: 32.4,
        total_price: 11800000,
        unit_price: 364198,
        date: "2024-02-18",
      },
    ]);
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DK-9125-00296000",
        address: "台南市永康區勝利街58巷4號",
        section_name: "兵南段",
        section_code: "9125",
        land_office: "DK",
        lot_number: "04080000",
        building_number: "00296000",
        source: "easymap_z10web",
        trusted_for_pdf: false,
        land_area_sqm: "66.29",
        announced_land_current_value: "41400",
        announced_land_value: "7700",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("地段")).toHaveValue("兵南段");
    });
    expect(screen.getByLabelText("地號")).toHaveValue("04080000");
    expect(screen.getByLabelText("建號")).toHaveValue("00296000");
    expect(screen.getByLabelText("土地面積（平方公尺）")).toHaveValue("66.29");
    expect(screen.getByLabelText("公告土地現值（元/平方公尺）")).toHaveValue("41400");
    expect(screen.getByLabelText("公告地價（元/平方公尺）")).toHaveValue("7700");
    await waitFor(() => {
      expect(screen.getByText("台南市永康區勝利街58巷6號")).toBeInTheDocument();
    });
    expect(screen.getByText("住宅大樓")).toBeInTheDocument();
    expect(screen.getByText("NT$11,800,000")).toBeInTheDocument();
    expect(mockQueryRealPrice).toHaveBeenCalledWith("永康區", "勝利街", 20, "台南市永康區勝利街58巷4號");
    expect(screen.queryByRole("button", { name: "我同意付費查詢建號" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));
    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          land_registry_data: expect.objectContaining({
            confirmed_registry_match: expect.objectContaining({
              land_area_sqm: "66.29",
              announced_land_current_value: "41400",
              announced_land_value: "7700",
            }),
          }),
        }),
      );
    });
  });

  it("loads existing normalized-address candidates before running discovery", async () => {
    mockListRegistryQueryRuns.mockResolvedValue([
      {
        id: "run-r02-cache-001",
        organization_id: "local",
        case_id: "case-existing",
        input_type: "address",
        source_input: "臺南市東區裕農路288巷17號8樓之1",
        match_status: "candidate",
        candidate_json: {
          input_address: "台南市東區裕農路288巷17號8樓之1",
          candidates: [
            {
              section_code: "1556",
              section_name: "富強段",
              land_no: "00700000",
              building_no: "00165000",
              building_area_sqm: "83.6",
              floor_label: "8樓之1",
              completion_date_roc: "0800829",
              age_years: "34",
              main_use: "住家用",
              lat: 22.986314,
              lng: 120.22908,
            },
          ],
        },
        cop_response_json: null,
        raw_response_json: null,
        total_cost_cents: 0,
        cache_hit: true,
        source_run_id: "run-paid-001",
        error_code: null,
        error_message: null,
        api_calls: [],
        created_at: "2026-05-26T00:00:00Z",
        updated_at: "2026-05-26T00:00:00Z",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("已帶入既有資料")).toBeInTheDocument();
    });
    expect(mockListRegistryQueryRuns).toHaveBeenCalledWith("台南市東區裕農路288巷17號8樓之1");
    expect(mockAddressLookup).not.toHaveBeenCalled();
    expect(screen.getByLabelText("地段")).toHaveValue("富強段");
    expect(screen.getByLabelText("地號")).toHaveValue("00700000");
    expect(screen.getByLabelText("建號")).toHaveValue("00165000");
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));
    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalled();
    });
    const payload = mockCreateCase.mock.calls.at(-1)?.[0];
    expect(payload?.land_registry_data?.candidate_options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary_fields: expect.objectContaining({
            registeredAreaPing: expect.any(Number),
            legalUse: "住家用",
            floor: "8樓之1",
            age: "34年",
            constructionDate: "0800829",
          }),
        }),
      ]),
    );
    expectCustomerCopyOnly();
  });

  it("warns on same confirmed registry key without blocking a new case", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DK-9125-00084000",
        address: "臺南市永康區勝利街58巷4號",
        section_name: "兵南段",
        section_code: "9125",
        land_office: "DK",
        lot_number: "04140000",
        building_number: "00084000",
        source: "easymap_r02",
        trusted_for_pdf: false,
      },
    ]);
    mockListCases.mockResolvedValue([
      {
        id: "case-existing",
        case_no: "AIRE-OLD-001",
        case_name: "既有案件",
        property_type: "residential",
        land_lot_no: "04140000",
        land_lots: ["04140000"],
        building_lot_no: "00084000",
        address: "臺南市永康區勝利街58巷4號",
        owner_name: null,
        status: "draft",
        created_at: 1,
        updated_at: 1,
        land_registry_data: {
          confirmed_registry_match: {
            section_name: "兵南段",
            land_no: "04140000",
            building_no: "00084000",
            status: "confirmed",
          },
        },
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("系統中已有同樣資訊")).toBeInTheDocument();
    });
    expect(screen.getByText("仍可建立新案件")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "開啟既有案件" }));
    expect(navigationMocks.push).toHaveBeenCalledWith("/cases/case-existing");

    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));
    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalled();
    });
  });

  it("keeps customer-facing address lookup copy free of implementation terms", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getAllByText("物件資料補齊").length).toBeGreaterThan(0);
    });
    expectCustomerCopyOnly();
  });

  it("runs registry detection from the primary submit button before case creation", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號1樓" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

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
        source: "cop_moi",
        trusted_for_pdf: true,
        lat: 22.986314,
        lng: 120.22908,
      },
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00167000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00167000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00229000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00229000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00230000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00230000",
        source: "cop_moi",
        trusted_for_pdf: true,
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
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "建立案件" })).toBeInTheDocument();
    });
    expect(screen.getByText("土地 1 筆 · 建物 4 筆")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "建號 00165000 / 地號 00700000" }));

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
          confirmed_registry_match: expect.objectContaining({
            office_code: "DC",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "00165000",
            registry_key: "DC-1556-00165000",
          }),
          candidate_options: expect.arrayContaining([
            expect.objectContaining({ normalized_parcel_id: "DC-1556-00700000" }),
            expect.objectContaining({
              section_code: "1556",
              land_no: "00700000",
              building_no: "00165000",
              normalized_parcel_id: "DC-1556-00165000",
            }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00167000",
              query_status: "candidate_data_available",
            }),
            expect.objectContaining({
              normalized_parcel_id: "DC-1556-00165000",
              query_status: "candidate_data_available",
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
          coordinate_source: expect.objectContaining({
            lat: 22.986314,
            lng: 120.22908,
            source: "candidate_reference",
          }),
        }),
      }),
    );
    expect(mockConfirmCaseRegistryMatch).toHaveBeenCalledWith(expect.objectContaining({
      caseId: "case-1",
      officeCode: "DC",
      sectionCode: "1556",
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00165000",
      registryKey: "DC-1556-00165000",
    }));
    const createdPayload = mockCreateCase.mock.calls[0]?.[0];
    const entries = createdPayload?.land_registry_data?.entries;
    expect(entries).not.toHaveProperty("building_ownership");
  });

  it("keeps multiple candidates pending until exactly one target is selected", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DC-1556-00700000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00167000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00167000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByRole("radiogroup", { name: "候選物件資料" })).toBeInTheDocument();
    });
    expect(screen.getByText("請先選定一筆候選；你可以先建立案件，之後再決定是否進入付費正式查詢。")).toBeInTheDocument();
    expect(screen.getByLabelText("地段")).toHaveValue("");
    expect(screen.getByLabelText("地號")).toHaveValue("");
    expect(screen.getByLabelText("建號")).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          land_lot_no: "",
          building_lot_no: null,
          land_registry_data: expect.objectContaining({
            registry_status: "registry_pending",
            missing_registry_fields: ["地段", "地號", "建號"],
            candidate_options: expect.arrayContaining([
              expect.objectContaining({ normalized_parcel_id: "DC-1556-00165000" }),
              expect.objectContaining({ normalized_parcel_id: "DC-1556-00167000" }),
            ]),
          }),
        }),
      );
    });
    expect(mockConfirmCaseRegistryMatch).not.toHaveBeenCalled();
  });

  it("confirms only the selected candidate from a multiple-candidate list", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
        section_name: "富強段",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "DC-1556-00167000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00167000",
        section_name: "富強段",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "建號 00167000 / 地號 00700000" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("radio", { name: "建號 00167000 / 地號 00700000" }));
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          land_lot_no: "00700000",
          building_lot_no: "00167000",
          land_registry_data: expect.objectContaining({
            confirmed_registry_match: expect.objectContaining({
              office_code: "DC",
              section_code: "1556",
              section_name: "富強段",
              land_no: "00700000",
              building_no: "00167000",
              registry_key: "DC-1556-00167000",
              status: "confirmed",
            }),
            candidate_options: expect.arrayContaining([
              expect.objectContaining({ normalized_parcel_id: "DC-1556-00165000" }),
              expect.objectContaining({ normalized_parcel_id: "DC-1556-00167000" }),
            ]),
          }),
        }),
      );
    });
    expect(mockConfirmCaseRegistryMatch).toHaveBeenCalledWith(expect.objectContaining({
      caseId: "case-1",
      officeCode: "DC",
      sectionCode: "1556",
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00167000",
      registryKey: "DC-1556-00167000",
    }));
  });

  it("shows manual fallback when registry returns multiple candidates", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0000",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0000",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0001",
        source: "cop_moi",
        trusted_for_pdf: true,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("找到多筆候選物件資料，請人工確認土地或建物")).toBeInTheDocument();
    });
    expect(screen.getByText("請選擇正確資料")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "候選物件資料" })).toBeInTheDocument();
    expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
  });

  it("creates a registry pending case when discovery cannot resolve registry fields", async () => {
    mockAddressLookup.mockResolvedValue([]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "無法自動補齊地址" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });
    expectCustomerCopyOnly();
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "無法自動補齊地址",
          land_lot_no: "",
          building_lot_no: null,
          land_registry_data: expect.objectContaining({
            registry_status: "registry_pending",
            missing_registry_fields: ["地段", "地號"],
          }),
        }),
      );
    });
    expect(mockConfirmCaseRegistryMatch).not.toHaveBeenCalled();
  });

  it("allows manual registry confirmation after discovery returns no trusted candidate", async () => {
    mockAddressLookup.mockResolvedValue([]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("地段"), { target: { value: "勝利段" } });
    fireEvent.change(screen.getByLabelText("地號"), { target: { value: "1043-0002" } });
    fireEvent.change(screen.getByLabelText("建號"), { target: { value: "00000000" } });
    fireEvent.click(screen.getByRole("button", { name: "建立案件" }));

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "台南市永康區勝利街58巷4號",
          land_lot_no: "1043-0002",
          building_lot_no: "00000000",
          land_registry_data: expect.objectContaining({
            confirmed_registry_match: expect.objectContaining({
              section_name: "勝利段",
              land_no: "1043-0002",
              building_no: "00000000",
              status: "confirmed",
            }),
          }),
        }),
      );
    });
    expect(mockConfirmCaseRegistryMatch).toHaveBeenCalledWith(expect.objectContaining({
      caseId: "case-1",
      officeCode: null,
      sectionCode: null,
      sectionName: "勝利段",
      landNo: "1043-0002",
      buildingNo: "00000000",
      registryKey: null,
    }));
  });

  it("does not treat mock placeholder parcels as confirmed address completion", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0001",
        address: "台南市永康區勝利街58巷4號",
        lot_number: "0001",
        building_number: "0001",
        source: "mock",
        trusted_for_pdf: false,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });
    expect(screen.queryByText("已自動補齊，請確認資料")).not.toBeInTheDocument();
    expect(screen.getByLabelText("地段")).toHaveValue("");
    expect(screen.getByLabelText("地號")).toHaveValue("");
    expect(screen.getByLabelText("建號")).toHaveValue("");
  });

  it("does not trust dev fixture candidates even if they claim trusted_for_pdf", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
        source: "dev_fixture",
        trusted_for_pdf: true,
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市東區裕農路288巷17號8樓之1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });
    expect(screen.queryByText("已自動補齊，請確認資料")).not.toBeInTheDocument();
    expect(screen.getByLabelText("地段")).toHaveValue("");
    expect(screen.getByLabelText("地號")).toHaveValue("");
    expect(screen.getByLabelText("建號")).toHaveValue("");
  });

  it("keeps registry fields blank when desktop lookup is unavailable", async () => {
    mockAddressLookup.mockRejectedValue(new Error("此功能需在 AIRE 桌面 App 中使用"));
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查詢物件資料" }));

    await waitFor(() => {
      expect(screen.getByText("需要人工補填資料")).toBeInTheDocument();
    });
    expect(screen.getByText(/請使用 AIRE 桌面版/)).toBeInTheDocument();
    expect(screen.queryByText("已自動補齊，請確認資料")).not.toBeInTheDocument();
    expect(screen.getByLabelText("地段")).toHaveValue("");
    expect(screen.getByLabelText("地號")).toHaveValue("");
    expect(screen.getByLabelText("建號")).toHaveValue("");
  });
});
