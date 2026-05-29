import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PullParcelDataButton } from "@/components/PullParcelDataButton";

const mocks = vi.hoisted(() => ({
  formalPullData: vi.fn(),
  updateCase: vi.fn(),
}));

vi.mock("@/lib/land-registry-api", () => ({
  formalPullData: mocks.formalPullData,
  mapErrorToMessage: (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政查詢帳號";
    return `查詢失敗：${message}`;
  },
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    update: mocks.updateCase,
  },
}));

vi.mock("@/components/OwnerAuthorizationDialog", () => ({
  OwnerAuthorizationDialog: (props: { open: boolean; onConfirm: () => void; onCancel: () => void }) =>
    props.open ? (
      <div>
        <button type="button" onClick={props.onConfirm}>
          授權確認
        </button>
        <button type="button" onClick={props.onCancel}>
          取消授權
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/PreChargeConfirmDialog", () => ({
  PreChargeConfirmDialog: (props: {
    apiCount: number;
    apiIds?: string[];
    estimatedCost: number;
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    props.open ? (
      <div>
        <span>預計查詢項目：{props.apiCount} 項</span>
        <span>預估費用：NT${props.estimatedCost}</span>
        <span>查詢明細：{(props.apiIds ?? []).join(",")}</span>
        <button type="button" onClick={props.onConfirm}>
          扣款確認
        </button>
        <button type="button" onClick={props.onCancel}>
          取消扣款
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/ManualFallbackInput", () => ({
  ManualFallbackInput: () => <div>manual fallback</div>,
}));

const registryResult = {
  results: {
    land_registry: {
      success: true,
      data: {
        data: {
          lot_number: "大安段一小段 123-4",
          area: 125.8,
        },
      },
    },
    building_registry: {
      success: true,
      data: {
        data: {
          building_number: "建號 778-2",
          purpose: "住家用",
          material: "鋼筋混凝土造",
          area: 128.2,
          main_building_area: 91.4,
          auxiliary_area: 8.3,
          common_area: 28.5,
          parking_area: 0,
          construction_date: "0710804",
        },
      },
    },
    building_ownership: {
      success: true,
      data: {
        data: {
          owner_name: "王小明",
          numerator: 1,
          denominator: 1,
        },
      },
    },
  },
  total_cost: 90,
};

describe("PullParcelDataButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formalPullData.mockResolvedValue({
      ...registryResult,
      run_id: "run-001",
      cache_hit: false,
      source_run_id: null,
    });
    mocks.updateCase.mockResolvedValue({ id: "case-001" });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:registry-payload"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("updates registry preview data and automatically persists pulled payload to the local case", async () => {
    const onPreview = vi.fn();
    const onSaved = vi.fn();

    render(
      <PullParcelDataButton
        apiIds={["land_registry", "building_registry", "building_ownership"]}
        caseId="case-001"
        onPreview={onPreview}
        onSaved={onSaved}
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("已寫入案件資料預覽")).toBeInTheDocument();
      expect(screen.getByText(/已讀到/)).toBeInTheDocument();
    });

    await waitFor(() => {
      const savedPayload = expect.objectContaining({
        schema: "aire.registry-provenance.v1",
        totalCost: 90,
        isPaid: true,
        pricingNote: "付費正式查詢：已於執行前確認費用與授權，結果可作為正式地政資料來源",
        entries: expect.objectContaining({
          land_registry: expect.objectContaining({
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: registryResult.results.land_registry.data,
          }),
          building_registry: expect.objectContaining({
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: registryResult.results.building_registry.data,
          }),
          building_ownership: expect.objectContaining({
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: registryResult.results.building_ownership.data,
          }),
        }),
      });
      expect(mocks.updateCase).toHaveBeenCalledWith("case-001", {
        land_registry_data: savedPayload,
      });
      expect(onSaved).toHaveBeenCalledWith(savedPayload);
    });
    expect(screen.queryByRole("button", { name: "確認儲存" })).not.toBeInTheDocument();
  });

  it("shows acquired formal import fields, missing reasons, and PDF targets after paid lookup", async () => {
    render(
      <PullParcelDataButton
        apiIds={["building_registry", "building_ownership", "building_other_rights"]}
        caseId="case-001"
        parcelId="DC-1511-03045000"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("正式資料匯入明細")).toBeInTheDocument();
    });

    expect(screen.getByText("登記坪數")).toBeInTheDocument();
    expect(screen.getByText("主建坪數")).toBeInTheDocument();
    expect(screen.getByText("附屬建物")).toBeInTheDocument();
    expect(screen.getByText("公共設施")).toBeInTheDocument();
    expect(screen.getByText("車位坪數")).toBeInTheDocument();
    expect(screen.getByText("法定用途")).toBeInTheDocument();
    expect(screen.getByText("建築完成日")).toBeInTheDocument();
    expect(screen.getAllByText("產權調查表—建物標示").length).toBeGreaterThan(0);
    expect(screen.getByText("未取得欄位")).toBeInTheDocument();
    expect(screen.getByText(/他項權利/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/MOI_API_|COP|JSON|R02/);
  });

  it("does not expose raw registry JSON download actions to customers", async () => {
    render(
      <PullParcelDataButton
        apiIds={["land_registry", "building_registry"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(mocks.updateCase).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("button", { name: /另存新檔|下載/ })).not.toBeInTheDocument();
  });

  it("shows actionable mapped error messages when formal pull cannot start", async () => {
    mocks.formalPullData.mockRejectedValueOnce(new Error("ApiKeyNotConfigured"));

    render(
      <PullParcelDataButton
        apiIds={["land_registry", "building_registry"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("請先在設定頁設定地政查詢帳號")).toBeInTheDocument();
    });
  });

  it("shows the estimated formal query cost before paid lookup", async () => {
    render(
      <PullParcelDataButton
        apiIds={["building_registry", "building_ownership"]}
        caseId="case-001"
        parcelId="富強段 00700000 / 00165000"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));

    expect(screen.getByText("預計查詢項目：2 項")).toBeInTheDocument();
    expect(screen.getByText("預估費用：NT$20")).toBeInTheDocument();
    expect(screen.getByText("查詢明細：building_registry,building_ownership")).toBeInTheDocument();
    expect(mocks.formalPullData).not.toHaveBeenCalled();
  });

  it("keeps failed query item identifiers out of visible fallback copy", async () => {
    mocks.formalPullData.mockResolvedValueOnce({
      run_id: "run-002",
      cache_hit: false,
      source_run_id: null,
      total_cost: 0,
      results: {
        MOI_API_037: {
          success: false,
          error: "COP317",
          source: "api",
        },
      },
    });

    render(
      <PullParcelDataButton
        apiIds={["MOI_API_037"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("以下項目查詢失敗，請手動填入資料：")).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/MOI_API_037|COP317|API/);
  });
});
