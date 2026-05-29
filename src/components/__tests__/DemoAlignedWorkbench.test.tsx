import "@testing-library/jest-dom/vitest";
import { fireEvent } from "@testing-library/dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateCase = vi.hoisted(() => vi.fn());
const mockImportCaseAsset = vi.hoisted(() => vi.fn());

vi.mock("@/lib/cases-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cases-api")>();
  return {
    ...actual,
    casesApi: {
      ...actual.casesApi,
      update: mockUpdateCase,
    },
  };
});

vi.mock("@/lib/floor-plan-assets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/floor-plan-assets")>();
  return {
    ...actual,
    importCaseAsset: mockImportCaseAsset,
  };
});

import { DemoAlignedWorkbench } from "../workbench/DemoAlignedWorkbench";
import type { CaseRow } from "@/lib/cases-api";
import { __resetMockStoreForTests } from "@/lib/mock-backend";

const caseRow: CaseRow = {
  id: "11111111-1111-4111-8111-111111111111",
  case_no: "A-2026-0521",
  case_name: "宜蘭五結農舍",
  property_type: "residential",
  land_lot_no: "五結段 123-1",
  land_lots: ["五結段 123-1", "五結段 123-2"],
  building_lot_no: "建號 88-1",
  address: "宜蘭縣五結鄉協和村親河路二段 1 號",
  owner_name: null,
  land_registry_data: null,
  current_step: 1,
  status: "draft",
  created_at: 1763200000,
  updated_at: 1763200000,
};

describe("DemoAlignedWorkbench", () => {
  beforeEach(() => {
    __resetMockStoreForTests();
    mockUpdateCase.mockReset();
    mockUpdateCase.mockResolvedValue({ ...caseRow, owner_name: "蔡國卿" });
    mockImportCaseAsset.mockReset();
    mockImportCaseAsset.mockResolvedValue({ id: "asset-1" });
  });

  it("renders the two-column case/chapter and field review workbench", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    const summaryRegion = screen.getByRole("region", { name: "物件摘要" });
    expect(screen.getByRole("heading", { name: "物件審核" })).toBeInTheDocument();
    expect(summaryRegion).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "欄位審核" })).toBeInTheDocument();
    expect(within(summaryRegion).getAllByText("名稱").length).toBeGreaterThan(0);
    expect(within(summaryRegion).getAllByText("地政組成").length).toBeGreaterThan(0);
    expect(within(summaryRegion).getAllByText("土地 2 筆｜建物 1 筆").length).toBeGreaterThan(0);
    expect(within(summaryRegion).getAllByText("已帶入").length).toBeGreaterThan(0);
    expect(within(summaryRegion).getAllByText("待補件").length).toBeGreaterThan(0);
    expect(within(summaryRegion).getAllByText("待確認").length).toBeGreaterThan(0);
    expect(screen.getByText(/本次調閱費用：0 元/)).toBeInTheDocument();
    expect(screen.queryByText("27 元")).not.toBeInTheDocument();
    expect(screen.getByLabelText("欄位審核表")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重新查詢" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "產生補件清單" })).not.toBeInTheDocument();
    expect(screen.queryByText("地政重查：後端串接中")).not.toBeInTheDocument();
    expect(screen.queryByText("自動補件：後端串接中")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "補件與現場" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "正式資料匯入" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "物件資料總覽" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "現場必問" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "費用" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PDF 檢查" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "本次調閱費用" })).toBeInTheDocument();
    expect(screen.queryByText("說明書章節")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "修改" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "預覽 PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步：補件與現場" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "欄位初審",
      "補件與現場",
      "正式資料匯入",
      "物件資料總覽",
      "PDF 檢查",
    ]);
  });

  it("uses the compact single-line summary on non-core workbench tabs", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="summary" />);

    const summaryRegion = screen.getByRole("region", { name: "物件摘要" });
    expect(within(summaryRegion).getByText("物件摘要")).toBeInTheDocument();
    expect(within(summaryRegion).getByText("宜蘭五結農舍")).toBeInTheDocument();
    expect(within(summaryRegion).getByText("宜蘭縣五結鄉協和村親河路二段 1 號")).toBeInTheDocument();
    expect(within(summaryRegion).queryByText("地政組成")).not.toBeInTheDocument();
    expect(within(summaryRegion).queryByText("資料狀態")).not.toBeInTheDocument();
  });

  it("uses customer-facing field labels and hides engineering codes", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    const workbench = screen.getByTestId("demo-aligned-workbench");
    expect(within(workbench).getByText("建物權利範圍")).toBeInTheDocument();
    expect(within(workbench).getAllByText("地政謄本匯入").length).toBeGreaterThan(0);
    expect(within(workbench).getAllByText("門牌建號查詢").length).toBeGreaterThan(0);
    expect(workbench.textContent).not.toMatch(/MOI_API_|COP309|COP|R02|便民系統|BASIC|pro|advanced|domain_failure/);
  });

  it("uses registry preview data as field review source and keeps supplement actions in the workbench", () => {
    render(
      <DemoAlignedWorkbench
        caseData={{
          ...caseRow,
          owner_name: "陳小美",
          land_registry_data: {
            building_registry: { data: { construction_date: "083/10/18" } },
            building_ownership: { data: { numerator: 1, denominator: 1 } },
          },
        }}
      />,
    );

    const workbench = screen.getByTestId("demo-aligned-workbench");
    expect(within(workbench).getByText("1/1")).toBeInTheDocument();
    expect(within(workbench).getByText("民國083年10月18日")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "補件與現場" }));
    const supplementRegion = screen.getByRole("region", { name: "補件與現場確認" });
    expect(supplementRegion).toBeInTheDocument();
    expect(within(supplementRegion).getByRole("button", { name: "加入補件清單" })).toBeInTheDocument();
    expect(within(supplementRegion).queryByRole("button", { name: "現場必問" })).not.toBeInTheDocument();
    expect(within(supplementRegion).queryByRole("button", { name: "手動上傳覆蓋" })).not.toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("建物現況回答")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("LINE 照片上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("地籍圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("空拍圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("格局圖上傳")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("地標圖上傳")).toBeInTheDocument();
    fireEvent.click(within(supplementRegion).getByRole("button", { name: "加入補件清單" }));
    expect(within(supplementRegion).getByText("已加入補件清單")).toBeInTheDocument();
  });

  it("turns missing source rows into actionable supplement fields and reflects values in source JSON", async () => {
    render(<DemoAlignedWorkbench caseData={{ ...caseRow, owner_name: null }} initialTab="summary" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
    expect(within(sourceRegion).getByText("屋主姓名")).toBeInTheDocument();
    expect(within(sourceRegion).getAllByText("需人工提供").length).toBeGreaterThan(0);
    expect(within(sourceRegion).queryByText("姓名比對結果")).not.toBeInTheDocument();
    expect(within(sourceRegion).getByText("門牌查詢建號")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("查詢未成功")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "補件與現場" }));
    const supplementRegion = screen.getByRole("region", { name: "補件與現場確認" });

    expect(within(supplementRegion).getByLabelText("屋主姓名補件值")).toBeInTheDocument();
    expect(within(supplementRegion).queryByLabelText("姓名比對結果補件值")).not.toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("門牌查詢建號補件值")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("格局補件值")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("座向補件值")).toBeInTheDocument();
    expect(within(supplementRegion).getByLabelText("管理費（元/月）補件值")).toBeInTheDocument();

    fireEvent.change(within(supplementRegion).getByLabelText("門牌查詢建號補件值"), {
      target: { value: "勝利段 58 建號" },
    });
    fireEvent.change(within(supplementRegion).getByLabelText("門牌查詢建號補件來源"), {
      target: { value: "人工輸入" },
    });

    await waitFor(() => {
      expect(within(supplementRegion).getByText("已補：勝利段 58 建號")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        caseRow.id,
        expect.objectContaining({
          land_registry_data: expect.objectContaining({
            schema: "aire.registry-provenance.v1",
            entries: expect.objectContaining({
              manual_registry_supplement: expect.objectContaining({
                source: "manual",
                status: "manual_confirmed",
                trustedForPdf: true,
                data: expect.objectContaining({
                  buildingNumberCandidate: "勝利段 58 建號",
                  sourceLabel: "人工輸入",
                }),
              }),
            }),
          }),
        }),
      );
    });

    fireEvent.click(screen.getByRole("tab", { name: "物件資料總覽" }));
    fireEvent.click(screen.getByText("管理明細"));
    await waitFor(() => {
      expect(screen.getAllByText(/勝利段 58 建號/).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/manual/)).toBeInTheDocument();
  });

  it("uses case provenance cost instead of demo billing when available", () => {
    render(
      <DemoAlignedWorkbench
        caseData={{
          ...caseRow,
          land_registry_data: {
            schema: "aire.registry-provenance.v1",
            generatedAt: "2026-05-22T00:00:00.000Z",
            totalCost: 0,
            entries: {
              building_ownership: {
                apiId: "building_ownership",
                source: "moi_api",
                status: "failed",
                trustedForPdf: false,
                error: "尚未取得正式建物所有權資料",
              },
            },
          },
        }}
      />,
    );

    expect(screen.getByRole("region", { name: "本次調閱費用" })).toHaveTextContent("本次調閱費用：0 元");
    expect(screen.getByText("本次只取得免費候選或物件基本資料；尚未產生正式地政謄本費用。")).toBeInTheDocument();
  });

  it("shows candidate parcel options and persists temporary and confirmed selections", async () => {
    const candidateCase: CaseRow = {
      ...caseRow,
      address: "台南市東區裕農路288巷17號8樓之1",
      land_lot_no: "0001",
      building_lot_no: null,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-23T00:00:00.000Z",
        entries: {
          address_lookup: {
            apiId: "address_lookup",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "COP317 門牌建號查詢未成功",
          },
        },
        candidate_options: [
          {
            candidate_id: "land:DC-1556-00700000",
            parcel_type: "land",
            office_code: "DC",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "",
            parcel_number: "00700000",
            normalized_parcel_id: "DC-1556-00700000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: { landAreaSqm: 120.5 },
            warnings: ["待屋主或權狀確認"],
          },
          {
            candidate_id: "building:DC-1556-00165000",
            parcel_type: "building",
            office_code: "DC",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "00165000",
            parcel_number: "00165000",
            normalized_parcel_id: "DC-1556-00165000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: {
              registeredAreaPing: 31.25,
              mainBuildingAreaPing: 23.1,
              legalUse: "住家用",
              constructionDate: "083/10/18",
              floor: "8樓之1",
            },
            warnings: ["待屋主或權狀確認是否為 8樓之1"],
          },
          {
            candidate_id: "building:DC-1556-00167000",
            parcel_type: "building",
            office_code: "DC",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "00167000",
            parcel_number: "00167000",
            normalized_parcel_id: "DC-1556-00167000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "failed",
            error_code: "COP312",
            error_message: "取得服務資訊失敗",
            summary_fields: {},
            warnings: ["候選 probe 失敗"],
          },
          {
            candidate_id: "building:DC-1556-00230000",
            parcel_type: "building",
            office_code: "DC",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "00230000",
            parcel_number: "00230000",
            normalized_parcel_id: "DC-1556-00230000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "failed",
            error_code: "COP305",
            error_message: "查無資料",
            summary_fields: {},
            warnings: ["候選查無資料"],
          },
        ],
      },
    };
    mockUpdateCase.mockImplementation(async (_id, input) => ({
      ...candidateCase,
      ...input,
    }));

    render(<DemoAlignedWorkbench caseData={candidateCase} initialTab="formal-import" />);

    const sourceRegion = screen.getByRole("region", { name: "正式資料匯入" });
    expect(within(sourceRegion).getByRole("region", { name: "候選土地建物清單" })).toBeInTheDocument();
    expect(within(sourceRegion).getByText("DC-1556-00700000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("DC-1556-00165000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("DC-1556-00167000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("DC-1556-00230000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText(/31\.25坪/)).toBeInTheDocument();
    expect(within(sourceRegion).queryByText(/COP312/)).not.toBeInTheDocument();
    expect(within(sourceRegion).getByText(/候選資料取得失敗/)).toBeInTheDocument();
    expect(within(sourceRegion).queryByText(/COP305/)).not.toBeInTheDocument();
    expect(within(sourceRegion).getAllByText(/候選查無資料/).length).toBeGreaterThan(0);

    fireEvent.click(within(sourceRegion).getByRole("button", { name: "確認 DC-1556-00700000" }));
    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        candidateCase.id,
        expect.objectContaining({
          land_lot_no: "00700000",
          land_lots: ["00700000"],
          land_registry_data: expect.objectContaining({
            confirmed_registry_match: expect.objectContaining({
              office_code: "DC",
              section_code: "1556",
              section_name: "富強段",
              land_no: "00700000",
              building_no: null,
              registry_key: "DC-1556-00700000",
            }),
            confirmed_parcel_ids: expect.objectContaining({
              land: "land:DC-1556-00700000",
            }),
          }),
        }),
      );
    });

    fireEvent.click(within(sourceRegion).getByRole("button", { name: "暫用 DC-1556-00165000" }));
    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        candidateCase.id,
        expect.objectContaining({
          land_registry_data: expect.objectContaining({
            selected_candidate_ids: expect.objectContaining({
              building: "building:DC-1556-00165000",
            }),
          }),
        }),
      );
    });

    fireEvent.click(within(sourceRegion).getByRole("button", { name: "確認 DC-1556-00165000" }));
    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        candidateCase.id,
        expect.objectContaining({
          building_lot_no: "00165000",
          land_registry_data: expect.objectContaining({
            confirmed_registry_match: expect.objectContaining({
              office_code: "DC",
              section_code: "1556",
              section_name: "富強段",
              land_no: "00700000",
              building_no: "00165000",
              registry_key: "DC-1556-00165000",
            }),
            confirmed_parcel_ids: expect.objectContaining({
              building: "building:DC-1556-00165000",
            }),
          }),
        }),
      );
    });
  });

  it("switches workbench tabs instead of showing every panel at once", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="supplements" />);

    expect(screen.getByRole("tab", { name: "補件與現場" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "補件與現場確認" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "欄位資料來源" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "物件資料總覽" }));

    expect(screen.getByRole("tab", { name: "物件資料總覽" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "欄位資料來源" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "補件與現場確認" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "候選土地建物清單" })).not.toBeInTheDocument();
  });

  it("supports SOP next-step navigation and inline field correction", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    fireEvent.click(screen.getAllByRole("button", { name: "修改" })[0]);
    expect(screen.getByLabelText("屋主姓名修改值")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一步：補件與現場" }));

    expect(screen.getByRole("tab", { name: "補件與現場" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "物件資料總覽" }));
    expect(screen.getByRole("region", { name: "欄位資料來源" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /下載管理資料|下載|另存/ })).not.toBeInTheDocument();
    expect(screen.getByText(/缺資料再進補件或正式資料匯入/)).toBeInTheDocument();
    expect(screen.getByText("管理明細")).toBeInTheDocument();
  });

  it("saves owner name correction to the case and reflects it in source JSON", async () => {
    render(<DemoAlignedWorkbench caseData={{ ...caseRow, owner_name: "余啟彰" }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "修改" })[0]);
    fireEvent.change(screen.getByLabelText("屋主姓名修改值"), {
      target: { value: "蔡國卿" },
    });
    fireEvent.click(screen.getByRole("button", { name: "完成" }));

    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(caseRow.id, { owner_name: "蔡國卿" });
    });

    fireEvent.click(screen.getByRole("tab", { name: "物件資料總覽" }));
    fireEvent.click(screen.getByText("管理明細"));
    await waitFor(() => {
      expect(screen.getAllByText(/蔡國卿/).length).toBeGreaterThan(0);
    });
  });

  it("shows source rows as customer-readable values and keeps owner comparison pending until formal data exists", () => {
    const sourceCase: CaseRow = {
      ...caseRow,
      case_name: "東和路47",
      address: "台南市東區東和路47號3樓",
      owner_name: "蔡國卿",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-26T00:00:00.000Z",
        totalCost: 0,
        entries: {},
        candidate_options: [
          {
            candidate_id: "building:DK-9125-00084000",
            parcel_type: "building",
            section_code: "9125",
            section_name: "東和段",
            parcel_number: "00084000",
            normalized_parcel_id: "DK-9125-00084000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: {
              registeredAreaPing: 38.78,
              legalUse: "住商用",
              constructionDate: "0710804",
              floor: "三層",
              age: "44年",
            },
            warnings: [],
          },
        ],
      },
    };

    render(<DemoAlignedWorkbench caseData={sourceCase} initialTab="summary" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
    expect(within(sourceRegion).getByText("蔡國卿")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("住商用")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("38.78 坪")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("民國071年08月04日")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("已找到建號 00084000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("待正式所有權資料後再比對")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "正式資料匯入" }));
    const importRegion = screen.getByRole("region", { name: "正式資料匯入" });
    expect(within(importRegion).getByRole("button", { name: "暫用 DK-9125-00084000" })).toBeInTheDocument();
    expect(within(importRegion).getByRole("button", { name: "確認 DK-9125-00084000" })).toBeInTheDocument();
    expect(sourceRegion.textContent).not.toContain("候選建號");
    expect(sourceRegion.textContent).not.toMatch(/R02|便民系統/);
  });

  it("keeps the paid formal import action hidden until the candidate is explicitly confirmed", () => {
    const singleCandidateCase: CaseRow = {
      ...caseRow,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-26T00:00:00.000Z",
        totalCost: 0,
        entries: {},
        candidate_options: [
          {
            candidate_id: "building:DK-9125-00084000",
            parcel_type: "building",
            section_code: "9125",
            section_name: "東和段",
            parcel_number: "00084000",
            normalized_parcel_id: "DK-9125-00084000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: {
              registeredAreaPing: 38.78,
              legalUse: "住商用",
            },
            warnings: [],
          },
        ],
      },
    };

    render(<DemoAlignedWorkbench caseData={singleCandidateCase} initialTab="formal-import" />);

    const importRegion = screen.getByRole("region", { name: "正式資料匯入" });
    expect(within(importRegion).queryByRole("button", { name: "正式資料匯入（付費）" })).not.toBeInTheDocument();
    expect(within(importRegion).getByRole("button", { name: "暫用 DK-9125-00084000" })).toBeInTheDocument();
    expect(within(importRegion).getByRole("button", { name: "確認 DK-9125-00084000" })).toBeInTheDocument();
  });

  it("shows the paid formal import action after the candidate is already confirmed", () => {
    const confirmedCandidateCase: CaseRow = {
      ...caseRow,
      building_lot_no: "DK-9125-00084000",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-26T00:00:00.000Z",
        totalCost: 0,
        entries: {},
        candidate_options: [
          {
            candidate_id: "building:DK-9125-00084000",
            parcel_type: "building",
            section_code: "9125",
            section_name: "東和段",
            land_no: "00083000",
            building_no: "00084000",
            parcel_number: "00084000",
            normalized_parcel_id: "DK-9125-00084000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            confirmation_state: "confirmed",
            summary_fields: {
              registeredAreaPing: 38.78,
              legalUse: "住商用",
            },
            warnings: [],
          },
        ],
        confirmed_parcel_ids: {
          building: "building:DK-9125-00084000",
        },
      },
    };

    render(<DemoAlignedWorkbench caseData={confirmedCandidateCase} initialTab="formal-import" />);

    const importRegion = screen.getByRole("region", { name: "正式資料匯入" });
    expect(within(importRegion).getByRole("button", { name: "正式資料匯入（付費）" })).toBeInTheDocument();
    expect(within(importRegion).queryByRole("button", { name: "確認 DK-9125-00084000" })).not.toBeInTheDocument();
  });

  it("uses a matching complete candidate when the prior manual confirmation lacks the formal COP key", async () => {
    const incompleteManualCase: CaseRow = {
      ...caseRow,
      case_name: "兵南段測試",
      land_lot_no: "00295000",
      building_lot_no: "00296000",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-29T00:00:00.000Z",
        totalCost: 0,
        entries: {},
        confirmed_registry_match: {
          section_name: "兵南段",
          land_no: "00295000",
          building_no: "00296000",
          registry_key: "manual-兵南段-00296000",
          status: "confirmed",
        },
        candidate_options: [
          {
            candidate_id: "building:DK-9125-00296000",
            parcel_type: "building",
            office_code: "DK",
            section_code: "9125",
            section_name: "兵南段",
            land_no: "00295000",
            building_no: "00296000",
            parcel_number: "00296000",
            normalized_parcel_id: "DK-9125-00296000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: {
              floor: "1樓",
            },
            warnings: [],
          },
        ],
      },
    };
    mockUpdateCase.mockImplementation(async (_id, input) => ({
      ...incompleteManualCase,
      ...input,
    }));

    render(<DemoAlignedWorkbench caseData={incompleteManualCase} initialTab="formal-import" />);

    const importRegion = screen.getByRole("region", { name: "正式資料匯入" });
    const manualRow = within(importRegion).getByText("manual-兵南段-00296000").closest("article");
    expect(manualRow).not.toBeNull();
    expect(within(manualRow as HTMLElement).queryByRole("button", { name: "正式資料匯入（付費）" })).not.toBeInTheDocument();
    expect(within(manualRow as HTMLElement).getByText("前次確認缺正式查詢代碼，請確認下方完整候選後再匯入。")).toBeInTheDocument();
    expect(within(importRegion).getByRole("button", { name: "正式資料匯入（付費）" })).toBeInTheDocument();
    expect(within(importRegion).queryByRole("button", { name: "確認 DK-9125-00296000" })).not.toBeInTheDocument();
  });

  it("does not show mock Taipei formal registry data for a Hsinchu case", () => {
    const hsinchuCase: CaseRow = {
      ...caseRow,
      case_name: "新竹市北區四維路",
      address: "新竹市北區四維路130號4樓之3",
      land_lot_no: "0010000",
      building_lot_no: "01262000",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-28T00:00:00.000Z",
        totalCost: 0,
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "mock",
            status: "success",
            trustedForPdf: false,
            data: {
              building_number: "建號 778-2",
              address: "台北市大安區和平東路一段 100 號五樓之三",
              construction_date: "2015-06-15",
            },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "mock",
            status: "success",
            trustedForPdf: false,
            data: {
              certificate_no: "北松字第012345號",
            },
          },
        },
      },
    };

    render(<DemoAlignedWorkbench caseData={hsinchuCase} initialTab="pdf" />);

    const pdfRegion = screen.getByRole("region", { name: "PDF 檢查內容" });
    expect(pdfRegion.textContent).not.toContain("台北市大安區和平東路");
    expect(pdfRegion.textContent).not.toContain("建號 778-2");
    expect(pdfRegion.textContent).not.toContain("北松字第012345號");
  });

  it("shows imported PDF fields and missing reasons before opening PDF preview", () => {
    const formalImportCase: CaseRow = {
      ...caseRow,
      owner_name: "蔡國卿",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-27T00:00:00.000Z",
        totalCost: 20,
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: {
              building_number: "03045000",
              area: 128.2,
              main_building_area: 91.4,
              auxiliary_area: 8.3,
              common_area: 28.5,
              parking_area: 0,
              building_purpose: "住商用",
              construction_date: "0710804",
            },
          },
        },
        candidate_options: [],
        selected_candidate_ids: {},
      },
    };

    render(<DemoAlignedWorkbench caseData={formalImportCase} initialTab="pdf" />);

    const pdfRegion = screen.getByRole("region", { name: "PDF 檢查內容" });
    const previewList = within(pdfRegion).getByLabelText("PDF 文字預覽清單");
    expect(within(previewList).getAllByText("登記坪數").length).toBeGreaterThan(0);
    expect(within(previewList).getByDisplayValue("128.2")).toBeInTheDocument();
    expect(within(previewList).getAllByText("主建坪數").length).toBeGreaterThan(0);
    expect(within(previewList).getByDisplayValue("91.4")).toBeInTheDocument();
    expect(within(previewList).getAllByText("附屬建物").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText("公共設施").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText("車位坪數").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText("法定用途").length).toBeGreaterThan(0);
    expect(within(previewList).getByDisplayValue("住商用")).toBeInTheDocument();
    expect(within(previewList).getAllByText("Logo").length).toBeGreaterThan(0);
    expect(within(previewList).getByDisplayValue("未設定品牌 Logo")).toBeInTheDocument();
    expect(within(previewList).getAllByText("生活機能").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText("實價登錄行情").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText("土地增值稅估算").length).toBeGreaterThan(0);
    expect(within(previewList).getByText(/缺公告現值、前次移轉現值、成交價或持分/)).toBeInTheDocument();
    expect(within(previewList).getAllByText("建物外觀").length).toBeGreaterThan(0);
    expect(within(previewList).getAllByText(/現場外觀照片/).length).toBeGreaterThan(0);
  });

  it("lets users edit and save the PDF review snapshot before preview export", async () => {
    mockUpdateCase.mockImplementation(async (_id, input) => ({
      ...caseRow,
      ...input,
    }));

    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="pdf" />);

    const pdfRegion = screen.getByRole("region", { name: "PDF 檢查內容" });
    fireEvent.change(within(pdfRegion).getByLabelText("屋主姓名"), {
      target: { value: "王先生" },
    });
    fireEvent.click(within(pdfRegion).getByRole("button", { name: "儲存 PDF 審核內容" }));

    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(
        caseRow.id,
        expect.objectContaining({
          land_registry_data: expect.objectContaining({
            dossier_editable_snapshot: expect.objectContaining({
              rows: expect.arrayContaining([
                expect.objectContaining({
                  label: "屋主姓名",
                  value: "王先生",
                  source: "PDF 前置審核",
                  status: "已人工確認",
                }),
              ]),
            }),
          }),
        }),
      );
    });
    expect(within(pdfRegion).getByText("已保存 PDF 前置審核內容")).toBeInTheDocument();
  });

  it("keeps candidate metadata and coordinates when supplement fields are saved", async () => {
    const candidateOptions = [
      {
        candidate_id: "building:DC-1556-00204000",
        parcel_type: "building" as const,
        normalized_parcel_id: "DC-1556-00204000",
        parcel_number: "00204000",
        query_status: "candidate_data_available" as const,
        summary_fields: { lat: 22.986217, lng: 120.228962 },
      },
    ];
    const coordinateSource = {
      lat: 22.986217,
      lng: 120.228962,
      source: "candidate_reference",
    };
    const buildingRegistryEntry = {
      apiId: "building_registry",
      source: "moi_api" as const,
      status: "success" as const,
      trustedForPdf: true,
      data: { building_area: 83.61 },
    };
    const sourceCase: CaseRow = {
      ...caseRow,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-26T00:00:00.000Z",
        totalCost: 20,
        entries: {
          building_registry: buildingRegistryEntry,
        },
        candidate_options: candidateOptions,
        coordinate_source: coordinateSource,
      },
    };

    render(<DemoAlignedWorkbench caseData={sourceCase} initialTab="supplements" />);

    const supplementRegion = await screen.findByRole("region", { name: "補件與現場確認" });
    fireEvent.change(within(supplementRegion).getByLabelText("格局補件值"), {
      target: { value: "3房2廳2衛" },
    });

    await waitFor(() => {
      expect(mockUpdateCase).toHaveBeenCalledWith(sourceCase.id, {
        land_registry_data: expect.objectContaining({
          candidate_options: candidateOptions,
          coordinate_source: coordinateSource,
          entries: expect.objectContaining({
            building_registry: buildingRegistryEntry,
            manual_registry_supplement: expect.objectContaining({
              source: "manual",
              trustedForPdf: true,
            }),
          }),
        }),
      });
    });
  });

  it("persists supplement answers, statuses, upload names, and PDF upload count across remounts", async () => {
    const { unmount } = render(<DemoAlignedWorkbench caseData={caseRow} initialTab="supplements" />);

    const supplementRegion = await screen.findByRole("region", { name: "補件與現場確認" });
    fireEvent.change(within(supplementRegion).getByLabelText("建物現況回答"), {
      target: { value: "有漏水或壁癌" },
    });
    fireEvent.change(within(supplementRegion).getByLabelText("建物現況狀態"), {
      target: { value: "已確認" },
    });
    fireEvent.change(within(supplementRegion).getByLabelText("地籍圖上傳"), {
      target: { files: [new File(["mock"], "cadastral-map.pdf", { type: "application/pdf" })] },
    });
    fireEvent.click(within(supplementRegion).getByRole("button", { name: "加入補件清單" }));

    await waitFor(() => {
      expect(within(supplementRegion).getByText("已加入補件清單")).toBeInTheDocument();
      expect(within(supplementRegion).getByText("已選擇：cadastral-map.pdf")).toBeInTheDocument();
      expect(within(supplementRegion).getAllByText("檔案").length).toBeGreaterThan(0);
      expect(within(supplementRegion).queryByText("選擇地籍圖檔案")).toBeNull();
    });

    unmount();
    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="supplements" />);

    const restoredRegion = await screen.findByRole("region", { name: "補件與現場確認" });
    await waitFor(() => {
      expect(within(restoredRegion).getByLabelText("建物現況回答")).toHaveValue("有漏水或壁癌");
      expect(within(restoredRegion).getByLabelText("建物現況狀態")).toHaveValue("已確認");
      expect(within(restoredRegion).getByText("已選擇：cadastral-map.pdf")).toBeInTheDocument();
      expect(within(restoredRegion).getByText("已加入補件清單")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "PDF 檢查" }));
    expect(screen.getByText("已上傳圖資：1 項")).toBeInTheDocument();
  });

  it("imports exterior photo as a case asset and shows PDF override status", async () => {
    render(<DemoAlignedWorkbench caseData={caseRow} initialTab="supplements" />);

    const supplementRegion = await screen.findByRole("region", { name: "補件與現場確認" });
    const file = new File(["mock-image"], "front-door.png", { type: "image/png" });
    fireEvent.change(within(supplementRegion).getByLabelText("建物外觀上傳"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockImportCaseAsset).toHaveBeenCalledWith({
        caseId: caseRow.id,
        kind: "exterior_photo",
        fileName: "front-door.png",
        mimeType: "image/png",
        fileBytes: expect.any(Uint8Array),
        source: "manual_upload",
        metadata: { slot: "建物外觀" },
      });
    });

    fireEvent.click(screen.getByRole("tab", { name: "PDF 檢查" }));
    const pdfRegion = screen.getByRole("region", { name: "PDF 檢查內容" });
    expect(within(pdfRegion).getByDisplayValue("已上傳：front-door.png")).toBeInTheDocument();
    expect(within(pdfRegion).getByText("已補件覆蓋")).toBeInTheDocument();
    expect(within(pdfRegion).getByText(/優先使用此案件保存的現場外觀照片/)).toBeInTheDocument();
  });
});
