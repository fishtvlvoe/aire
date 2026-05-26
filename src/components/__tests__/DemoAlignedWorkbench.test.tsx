import "@testing-library/jest-dom/vitest";
import { fireEvent } from "@testing-library/dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateCase = vi.hoisted(() => vi.fn());

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
  });

  it("renders the two-column case/chapter and field review workbench", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    expect(screen.getByRole("heading", { name: "物件審核" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "物件摘要" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "欄位審核" })).toBeInTheDocument();
    expect(screen.getByText("地政")).toBeInTheDocument();
    expect(screen.getByText("土地 2 筆")).toBeInTheDocument();
    expect(screen.getByText("建物 1 筆")).toBeInTheDocument();
    expect(screen.getByText("0 件")).toBeInTheDocument();
    expect(screen.getByText("6 件")).toBeInTheDocument();
    expect(screen.getByText("2 件")).toBeInTheDocument();
    expect(screen.getAllByText("0 元").length).toBeGreaterThan(0);
    expect(screen.queryByText("27 元")).not.toBeInTheDocument();
    expect(screen.getByLabelText("欄位審核表")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重新查詢" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "產生補件清單" })).not.toBeInTheDocument();
    expect(screen.queryByText("地政重查：後端串接中")).not.toBeInTheDocument();
    expect(screen.queryByText("自動補件：後端串接中")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "補件/現場" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "現場必問" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "費用" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PDF 檢查" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "本次調閱費用" })).toBeInTheDocument();
    expect(screen.queryByText("說明書章節")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "修改" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "下一步：資料來源" })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("tab", { name: "補件/現場" }));
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
    render(<DemoAlignedWorkbench caseData={{ ...caseRow, owner_name: null }} initialTab="sources" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
    expect(within(sourceRegion).getByText("屋主姓名")).toBeInTheDocument();
    expect(within(sourceRegion).getAllByText("需人工提供").length).toBeGreaterThan(0);
    expect(within(sourceRegion).queryByText("姓名比對結果")).not.toBeInTheDocument();
    expect(within(sourceRegion).getByText("門牌查詢建號")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("查詢未成功")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "補件/現場" }));
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

    fireEvent.click(screen.getByRole("tab", { name: "資料來源" }));
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
            section_code: "1556",
            section_name: "富強段",
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
            section_code: "1556",
            section_name: "富強段",
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
            section_code: "1556",
            section_name: "富強段",
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
            section_code: "1556",
            section_name: "富強段",
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

    render(<DemoAlignedWorkbench caseData={candidateCase} initialTab="sources" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
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
          land_lot_no: "DC-1556-00700000",
          land_lots: ["DC-1556-00700000"],
          land_registry_data: expect.objectContaining({
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
          building_lot_no: "DC-1556-00165000",
          land_registry_data: expect.objectContaining({
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

    expect(screen.getByRole("tab", { name: "補件/現場" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "補件與現場確認" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "欄位資料來源" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "資料來源" }));

    expect(screen.getByRole("tab", { name: "資料來源" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "欄位資料來源" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "補件與現場確認" })).not.toBeInTheDocument();
  });

  it("supports SOP next-step navigation and inline field correction", () => {
    render(<DemoAlignedWorkbench caseData={caseRow} />);

    fireEvent.click(screen.getAllByRole("button", { name: "修改" })[0]);
    expect(screen.getByLabelText("屋主姓名修改值")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一步：資料來源" }));

    expect(screen.getByRole("tab", { name: "資料來源" })).toHaveAttribute("aria-selected", "true");
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

    fireEvent.click(screen.getByRole("tab", { name: "資料來源" }));
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

    render(<DemoAlignedWorkbench caseData={sourceCase} initialTab="sources" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
    expect(within(sourceRegion).getByText("蔡國卿")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("住商用")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("38.78 坪")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("民國071年08月04日")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("已找到建號 00084000")).toBeInTheDocument();
    expect(within(sourceRegion).getByText("待正式所有權資料後再比對")).toBeInTheDocument();
    expect(within(sourceRegion).getByRole("button", { name: "正式資料匯入（付費）" })).toBeInTheDocument();
    expect(sourceRegion.textContent).not.toContain("候選建號");
    expect(sourceRegion.textContent).not.toMatch(/R02|便民系統/);
  });

  it("puts the paid formal import action inside a single usable candidate card", () => {
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

    render(<DemoAlignedWorkbench caseData={singleCandidateCase} initialTab="sources" />);

    const sourceRegion = screen.getByRole("region", { name: "欄位資料來源" });
    expect(within(sourceRegion).getByRole("button", { name: "正式資料匯入（付費）" })).toBeInTheDocument();
    expect(within(sourceRegion).queryByRole("button", { name: "確認" })).not.toBeInTheDocument();
    expect(within(sourceRegion).queryByRole("button", { name: "取消" })).not.toBeInTheDocument();
    expect(within(sourceRegion).queryByRole("button", { name: /暫用/ })).not.toBeInTheDocument();
    expect(within(sourceRegion).queryByRole("button", { name: /確認 DK-9125-00084000/ })).not.toBeInTheDocument();
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
});
