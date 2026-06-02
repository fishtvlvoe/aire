import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
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
      expect(screen.getByText("已寫入案件，可用於預覽與 PDF")).toBeInTheDocument();
      expect(screen.getAllByText(/已讀到/).length).toBeGreaterThan(0);
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

  it("keeps formal import details out of the page and shows them in a dialog", async () => {
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
      expect(screen.getByRole("dialog", { name: "地政資料匯入明細" })).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog", { name: "地政資料匯入明細" });
    expect(within(dialog).getByText("登記坪數")).toBeInTheDocument();
    expect(within(dialog).getByText("主建坪數")).toBeInTheDocument();
    expect(within(dialog).getByText("附屬建物")).toBeInTheDocument();
    expect(within(dialog).getByText("公共設施")).toBeInTheDocument();
    expect(within(dialog).getByText("車位坪數")).toBeInTheDocument();
    expect(within(dialog).getByText("法定用途")).toBeInTheDocument();
    expect(within(dialog).getByText("建築完成日")).toBeInTheDocument();
    expect(within(dialog).getAllByText("產權調查表—建物標示").length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/未取得欄位/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "關閉明細" }));
    expect(screen.queryByText("正式資料匯入明細")).not.toBeInTheDocument();
    expect(screen.queryByText("登記坪數")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看匯入明細" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/MOI_API_|COP|JSON|R02/);
  });

  it("blocks saving formal data when the returned building address does not match the case address", async () => {
    mocks.formalPullData.mockResolvedValueOnce({
      run_id: "run-mismatch",
      cache_hit: false,
      source_run_id: null,
      total_cost: 20,
      results: {
        building_registry: {
          success: true,
          source: "api",
          data: {
            data: {
              building_address: "勝利里勝利街５８巷１６號",
              area: 102.77,
              construction_date: "0780705",
            },
          },
        },
        building_ownership: {
          success: true,
          source: "api",
          data: {
            data: {
              numerator: 1,
              denominator: 1,
            },
          },
        },
      },
    });

    render(
      <PullParcelDataButton
        apiIds={["building_registry", "building_ownership"]}
        caseId="case-001"
        expectedAddress="台南市永康區勝利街58巷4號"
        parcelId="DK-9125-00296000"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "地政查詢失敗" })).toBeInTheDocument();
    });
    expect(screen.getAllByText(/正式資料門牌與案件地址不一致/).length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain("58巷4號");
    expect(document.body.textContent).toContain("５８巷１６號");
    expect(mocks.updateCase).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "地政資料匯入明細" })).not.toBeInTheDocument();
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
      expect(screen.getAllByText("請先在設定頁設定地政查詢帳號").length).toBeGreaterThan(0);
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
    expect(screen.getByText("預估費用：NT$2")).toBeInTheDocument();
    expect(screen.getByText("查詢明細：building_registry,building_ownership")).toBeInTheDocument();
    expect(mocks.formalPullData).not.toHaveBeenCalled();
  });

  it("opens a compact failure dialog with API error details instead of inline manual fallback forms", async () => {
    mocks.formalPullData.mockResolvedValueOnce({
      run_id: "run-002",
      cache_hit: false,
      source_run_id: null,
      total_cost: 0,
      results: {
        building_other_rights: {
          success: false,
          error: "COP317",
          source: "api",
        },
      },
    });

    render(
      <PullParcelDataButton
        apiIds={["building_other_rights"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /正式查詢/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "地政查詢失敗" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "查詢失敗", hidden: true })).toBeDisabled();
    expect(screen.getByText("building_other_rights")).toBeInTheDocument();
    expect(screen.getByText("COP317")).toBeInTheDocument();
    expect(screen.getByText("本次地政 API 有 1 項沒有成功，資料不會標記為正式謄本。")).toBeInTheDocument();
    expect(screen.queryByText("manual fallback")).not.toBeInTheDocument();
    expect(screen.queryByText("以下項目查詢失敗，請手動填入資料：")).not.toBeInTheDocument();
  });
});
