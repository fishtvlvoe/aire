import "@testing-library/jest-dom/vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PullParcelDataButton } from "@/components/PullParcelDataButton";

const mocks = vi.hoisted(() => ({
  pullData: vi.fn(),
  updateCase: vi.fn(),
  isTauriEnv: vi.fn(),
  safeInvoke: vi.fn(),
}));

vi.mock("@/lib/land-registry-api", () => ({
  pullData: mocks.pullData,
  mapErrorToMessage: (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政 API 金鑰";
    return `查詢失敗：${message}`;
  },
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    update: mocks.updateCase,
  },
}));

vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: mocks.isTauriEnv,
  safeInvoke: mocks.safeInvoke,
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
  PreChargeConfirmDialog: (props: { open: boolean; onConfirm: () => void; onCancel: () => void }) =>
    props.open ? (
      <div>
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
    mocks.pullData.mockResolvedValue(registryResult);
    mocks.updateCase.mockResolvedValue({ id: "case-001" });
    mocks.isTauriEnv.mockResolvedValue(false);
    mocks.safeInvoke.mockResolvedValue("/tmp/registry.json");
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:registry-payload"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("updates registry preview data and persists pulled payload to the local case", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: /拉謄本/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("右側已更新謄本資料預覽")).toBeInTheDocument();
      expect(screen.getByText(/已讀到/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "確認儲存" }));

    await waitFor(() => {
      const savedPayload = expect.objectContaining({
        schema: "aire.registry-provenance.v1",
        totalCost: 90,
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
  });

  it("saves registry payload as a browser-local file without updating the case again", async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <PullParcelDataButton
        apiIds={["land_registry", "building_registry"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /拉謄本/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /另存新檔/ })).toBeEnabled();
    });

    await userEvent.click(screen.getByRole("button", { name: /另存新檔/ }));

    await waitFor(() => {
      expect(anchorClick).toHaveBeenCalled();
      expect(screen.getByText("已下載謄本資料檔，可供未來匯入使用")).toBeInTheDocument();
    });

    expect(mocks.updateCase).not.toHaveBeenCalled();
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
  });

  it("shows actionable mapped error messages when formal pull cannot start", async () => {
    mocks.pullData.mockRejectedValueOnce(new Error("ApiKeyNotConfigured"));

    render(
      <PullParcelDataButton
        apiIds={["land_registry", "building_registry"]}
        caseId="case-001"
        parcelId="大安段一小段 123-4"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /拉謄本/ }));
    await userEvent.click(screen.getByRole("button", { name: "授權確認" }));
    await userEvent.click(screen.getByRole("button", { name: "扣款確認" }));

    await waitFor(() => {
      expect(screen.getByText("請先在設定頁設定地政 API 金鑰")).toBeInTheDocument();
    });
  });
});
