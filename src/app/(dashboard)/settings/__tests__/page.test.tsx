import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

let mockSessionRole: "admin" | "user" = "admin";
let mockFeatureFlags = [
  { id: "google-map", name: "Google 地圖", enabled: false },
  { id: "aerial-photo", name: "空拍圖", enabled: false },
  { id: "street-view-reference", name: "街景參考", enabled: false },
  { id: "ai-floor-plan", name: "AI 格局圖整理", enabled: false },
  { id: "cadastral-map", name: "地籍圖整理", enabled: false },
  { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
];
let mockProfileSettings = {
  name: "余啟彰",
  email: "fish.myfb@gmail.com",
  brandColor: "#174d36",
  logoName: "",
  passwordUpdatedAt: null as string | null,
};
let mockRegistryRows: Array<Record<string, unknown>> = [];
let mockBillingEntries = [
  {
    run_id: "run-building-001",
    object_type: "building",
    object_type_label: "戶建",
    service_name: "建物所有權資料",
    target: "AIRE-2026-001 / 建號 88-1",
    status_label: "查詢成功",
    transaction_id: "TXN-001",
    cost: 27,
    charged_at: "2026-05-18T22:52:20+08:00",
  },
  {
    run_id: "run-address-001",
    object_type: "address",
    object_type_label: "門牌",
    service_name: "門牌建號查詢",
    target: "AIRE-2026-001 / 台南市永康區勝利街58巷4號1樓",
    status_label: "查詢失敗",
    transaction_id: "COP309",
    cost: 0,
    charged_at: "2026-05-18T22:52:20+08:00",
  },
];
let mockLicenseStatus: Record<string, unknown> = { status: "none", serial_key: null };
let mockLandApiSettings = { clientId: "", secret: "" };
let mockTrialStatus = {
  plan: "trial",
  status: "active",
  startedAt: "2026-05-25T00:00:00.000Z",
  endsAt: "2026-06-24T23:59:59.000Z",
};

// Mock mockInvoke（所有子元件透過 mockInvoke 存取資料）
vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === "get_session") {
      return {
        authenticated: true,
        user: { email: `${mockSessionRole}@test.aire`, role: mockSessionRole },
      };
    }
    if (cmd === "get_license_status") {
      return mockLicenseStatus;
    }
    if (cmd === "get_land_api_settings") {
      return mockLandApiSettings;
    }
    if (cmd === "get_premium_status") {
      return { subscribed: false, plan: null, expires_at: null };
    }
    if (cmd === "get_feature_flags") {
      return mockFeatureFlags;
    }
    if (cmd === "toggle_feature_flag") {
      mockFeatureFlags = mockFeatureFlags.map((flag) =>
        flag.id === args?.id ? { ...flag, enabled: !flag.enabled } : flag,
      );
      return { success: true, enabled: mockFeatureFlags.find((flag) => flag.id === args?.id)?.enabled ?? false };
    }
    if (cmd === "get_profile_settings") {
      return mockProfileSettings;
    }
    if (cmd === "save_profile_settings") {
      mockProfileSettings = {
        ...mockProfileSettings,
        name: typeof args?.name === "string" ? args.name : mockProfileSettings.name,
        email: typeof args?.email === "string" ? args.email : mockProfileSettings.email,
        brandColor: typeof args?.brandColor === "string" ? args.brandColor : mockProfileSettings.brandColor,
        logoName: typeof args?.logoName === "string" ? args.logoName : mockProfileSettings.logoName,
      };
      return { success: true };
    }
    if (cmd === "update_profile_password") {
      mockProfileSettings = {
        ...mockProfileSettings,
        passwordUpdatedAt: "2026-05-22T00:00:00.000Z",
      };
      return { success: true, passwordUpdatedAt: mockProfileSettings.passwordUpdatedAt };
    }
    if (cmd === "land_registry_get_balance") {
      return { month_total_cost: 27, month_query_count: 2, low_balance_warning: false };
    }
    if (cmd === "land_registry_list_billing_entries") return mockBillingEntries;
    if (cmd === "list_registry_query_runs") {
      return mockRegistryRows;
    }
    if (cmd === "get_registry_query_run_detail") {
      return {
        id: args?.runId ?? args?.run_id ?? "run-r02-001",
        organization_id: "local-device",
        case_id: "case-r02-001",
        input_type: "address",
        source_input: "台南市東區裕農路288巷17號8樓之1",
        match_status: "candidate",
        candidate_json: { adapter: "easymap_r02_desktop" },
        cop_response_json: null,
        raw_response_json: { adapter: "easymap_r02_desktop" },
        total_cost_cents: 0,
        cache_hit: false,
        source_run_id: null,
        error_code: null,
        error_message: null,
        api_calls: [],
        created_at: "2026-05-25T00:00:00.000Z",
        updated_at: "2026-05-25T00:00:00.000Z",
      };
    }
    if (cmd === "get_trial_status") {
      return mockTrialStatus;
    }
    if (cmd === "land_registry_record_r02_result_text") {
      return { run_id: "run-r02-001", ok: true, discovery: { adapter: "easymap_r02_desktop" }, error: null };
    }
    if (cmd === "land_registry_sync_query_run_to_saas") {
      return { synced: true, remote_run_id: "remote-r02-001" };
    }
    return { success: true };
  }),
}));

vi.mock("@/lib/land-registry-api", () => ({
  getBalance: vi.fn(async () => ({ month_total_cost: 27, month_query_count: 2, low_balance_warning: false })),
  listBillingEntries: vi.fn(async () => mockBillingEntries),
  listRegistryQueryRuns: vi.fn(async () => mockRegistryRows),
  getRegistryQueryRunDetail: vi.fn(async (runId: string) => ({
    id: runId ?? "run-r02-001",
    organization_id: "local-device",
    case_id: "case-r02-001",
    input_type: "address",
    source_input: "台南市東區裕農路288巷17號8樓之1",
    match_status: "candidate",
    candidate_json: { adapter: "easymap_r02_desktop" },
    cop_response_json: null,
    raw_response_json: { adapter: "easymap_r02_desktop" },
    total_cost_cents: 2700,
    cache_hit: false,
    source_run_id: null,
    error_code: null,
    error_message: null,
    api_calls: [
      {
        id: "call-001",
        service_code: "building_ownership",
        transaction_id: "TXN-001",
        http_status: 200,
        moi_code: null,
        moi_message: null,
        return_rows: 2,
        cost_cents: 2700,
        started_at: "2026-05-25T00:00:00.000Z",
        finished_at: "2026-05-25T00:00:02.000Z",
      },
    ],
    created_at: "2026-05-25T00:00:00.000Z",
    updated_at: "2026-05-25T00:00:00.000Z",
  })),
}));

import SettingsPage from "../page";
import { mockInvoke } from "@/lib/mock-backend";
vi.mock("@/lib/auth", () => ({
  getDeviceSessionStatus: vi.fn(async () => ({
    status: "active",
    email: "admin@test.aire",
    persistedAt: "2026-05-25T00:00:00.000Z",
  })),
}));

let mockSection: string | null = null;

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? mockSection : null),
  }),
}));

describe("Settings page（重組後）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSection = null;
    mockSessionRole = "admin";
    mockFeatureFlags = [
      { id: "google-map", name: "Google 地圖", enabled: false },
      { id: "aerial-photo", name: "空拍圖", enabled: false },
      { id: "street-view-reference", name: "街景參考", enabled: false },
      { id: "ai-floor-plan", name: "AI 格局圖整理", enabled: false },
      { id: "cadastral-map", name: "地籍圖整理", enabled: false },
      { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
    ];
    mockProfileSettings = {
      name: "余啟彰",
      email: "fish.myfb@gmail.com",
      brandColor: "#174d36",
      logoName: "",
      passwordUpdatedAt: null,
    };
    mockRegistryRows = [];
    mockBillingEntries = [
      {
        run_id: "run-building-001",
        object_type: "building",
        object_type_label: "戶建",
        service_name: "建物所有權資料",
        target: "AIRE-2026-001 / 建號 88-1",
        status_label: "查詢成功",
        transaction_id: "TXN-001",
        cost: 27,
        charged_at: "2026-05-18T22:52:20+08:00",
      },
      {
        run_id: "run-address-001",
        object_type: "address",
        object_type_label: "門牌",
        service_name: "門牌建號查詢",
        target: "AIRE-2026-001 / 台南市永康區勝利街58巷4號1樓",
        status_label: "查詢失敗",
        transaction_id: "COP309",
        cost: 0,
        charged_at: "2026-05-18T22:52:20+08:00",
      },
    ];
    mockLicenseStatus = { status: "none", serial_key: null };
    mockLandApiSettings = { clientId: "", secret: "" };
    mockTrialStatus = {
      plan: "trial",
      status: "active",
      startedAt: "2026-05-25T00:00:00.000Z",
      endsAt: "2026-06-24T23:59:59.000Z",
    };
  });

  it("預設顯示個人設定", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "個人設定" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PDF 開啟密碼" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "個人名稱與 Email" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "品牌色與 Logo" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("個人名稱")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("目前 PDF 密碼（首次可留空）")).toBeInTheDocument();
    expect(screen.getByLabelText("新 PDF 密碼")).toBeInTheDocument();
    expect(screen.queryByLabelText("品牌色")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("品牌 Logo 上傳")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "帳號與授權管理" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "目前操作紀錄" })).not.toBeInTheDocument();
  });

  it("個人設定儲存到 mock backend 並可重新載入", async () => {
    const mockedInvoke = vi.mocked(mockInvoke);
    const { unmount } = render(<SettingsPage />);

    const nameInput = await screen.findByLabelText("個人名稱");
    fireEvent.change(nameInput, { target: { value: "王小明" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wang@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存個人資料" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("save_profile_settings", expect.objectContaining({
        name: "王小明",
        email: "wang@example.com",
      }));
      expect(screen.getByText("個人資料已儲存")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("目前 PDF 密碼（首次可留空）"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("新 PDF 密碼"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存 PDF 密碼" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("update_profile_password", {
        currentPassword: "",
        newPassword: "new-password",
      });
      expect(screen.getByText("PDF 密碼已更新")).toBeInTheDocument();
    });

    unmount();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("個人名稱")).toHaveValue("王小明");
      expect(screen.getByLabelText("Email")).toHaveValue("wang@example.com");
      expect(screen.queryByLabelText("品牌色")).not.toBeInTheDocument();
    });
  });

  it("設定頁不重複顯示頁內分類選單", async () => {
    render(<SettingsPage />);
    expect(screen.queryByRole("heading", { name: "設定分類" })).not.toBeInTheDocument();
  });

  it("渲染授權管理區塊", async () => {
    mockSection = "registry-auth";
    render(<SettingsPage />);
    expect(await screen.findByText("地政查詢帳號")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "前往地政註冊" })).toHaveAttribute(
      "href",
      "https://cop.moi.gov.tw/Register",
    );
    expect(screen.getByText("請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。")).toBeInTheDocument();
    expect(screen.getByText("教學影片")).toBeInTheDocument();
  });

  it("渲染地政 API 設定區塊", async () => {
    mockSection = "registry-auth";
    render(<SettingsPage />);
    expect(await screen.findByText("地政查詢帳號")).toBeInTheDocument();
  });

  it("方案設定只顯示目前可用的基本款與帳號授權狀態", async () => {
    mockSection = "plans";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "方案設定" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本款" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "進階款" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "高級款" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "帳號與授權管理" })).toBeInTheDocument();
    expect(screen.getByText("帳號角色")).toBeInTheDocument();
    expect(await screen.findByText("管理員")).toBeInTheDocument();
    expect(screen.getAllByText("目前方案").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("試用中，到期日 2026-06-24")).toBeInTheDocument();
    expect(screen.getByText("尚未啟用")).toBeInTheDocument();
    expect(screen.getByText("尚未設定")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "前往升級" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "預留功能" })).not.toBeInTheDocument();
    expect(screen.queryByText("目前正在開發中。")).not.toBeInTheDocument();
    expect(screen.queryByText("測試版已開啟")).not.toBeInTheDocument();
    expect(screen.queryByText(/正式版歸在/)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Google 地圖未啟用" })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "實價登錄未啟用" })).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });

  it("系統設定顯示已設定與到期的授權狀態", async () => {
    mockSection = "plans";
    mockTrialStatus = {
      plan: "basic",
      status: "expired",
      startedAt: "2026-04-25T00:00:00.000Z",
      endsAt: "2026-05-24T23:59:59.000Z",
    };
    mockLicenseStatus = { status: "expired", serial_key: "AIRE-TEST-2026-ADMIN" };
    mockLandApiSettings = { clientId: "customer-client", secret: "customer-secret" };

    render(<SettingsPage />);

    expect(await screen.findByText("試用已到期")).toBeInTheDocument();
    expect(screen.getByText("授權已過期")).toBeInTheDocument();
    expect(screen.getByText("已設定")).toBeInTheDocument();
  });

  it("非管理員也不會看到尚未開放的預留功能開關", async () => {
    mockSection = "plans";
    mockSessionRole = "user";
    render(<SettingsPage />);

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "預留功能" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本款" })).toBeInTheDocument();
  });

  it("資料來源頁不混入授權、升級與 Super Admin", async () => {
    mockSection = "registry-rules";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "資料來源" })).toBeInTheDocument();
    expect(screen.getByLabelText("地籍圖上傳")).toBeInTheDocument();
    expect(screen.getByLabelText("空拍圖上傳")).toBeInTheDocument();
    expect(screen.getByLabelText("格局圖上傳")).toBeInTheDocument();
    expect(screen.getByLabelText("地標圖上傳")).toBeInTheDocument();
    expect(screen.queryByText("授權管理")).not.toBeInTheDocument();
    expect(screen.queryByText("地政查詢帳號")).not.toBeInTheDocument();
    expect(screen.queryByText("實價登錄 MCP Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });

  it("費用紀錄顯示地政查詢明細與總計", async () => {
    mockSection = "billing";
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "費用紀錄" })).toBeInTheDocument();
    expect(screen.getByText("費用歸屬")).toBeInTheDocument();
    expect(screen.getByText("本月使用量")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "地政查詢明細" })).toBeInTheDocument();
    expect(screen.getAllByText("建物所有權資料").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("門牌建號查詢")).toBeInTheDocument();
    expect(screen.getByText("戶建")).toBeInTheDocument();
    expect(screen.getByText("門牌")).toBeInTheDocument();
    expect(screen.getByText("管理明細可查")).toBeInTheDocument();
    expect(screen.queryByText("COP309")).not.toBeInTheDocument();
    expect(screen.getByText("地政費用合計 27 元")).toBeInTheDocument();
    expect(screen.getByText("AIRE 方案功能")).toBeInTheDocument();
  });

  it("費用紀錄可點入查詢 saved run、cache、來源紀錄與服務列", async () => {
    mockSection = "billing";
    render(<SettingsPage />);

    expect(await screen.findByRole("heading", { name: "地政查詢明細" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "查看" })[0]);

    expect(await screen.findByRole("region", { name: "費用明細" })).toBeInTheDocument();
    expect(screen.getByText("查詢紀錄")).toBeInTheDocument();
    expect(screen.getByText("run-building-001")).toBeInTheDocument();
    expect(screen.getByText("快取")).toBeInTheDocument();
    expect(screen.getByText("新查詢")).toBeInTheDocument();
    expect(screen.getByText("來源紀錄")).toBeInTheDocument();
    expect(screen.getByText("總費用")).toBeInTheDocument();
    expect(screen.getAllByText("建物所有權資料").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("27 元").length).toBeGreaterThanOrEqual(1);
  });

  it("查詢紀錄頁僅顯示追溯資訊且不出現技術操作區", async () => {
    mockSection = "registry-records";
    mockRegistryRows = [
      {
        id: "run-error-001",
        organization_id: "local-device",
        case_id: "case-r02-001",
        input_type: "address",
        source_input: "台南市東區裕農路288巷17號8樓之1",
        match_status: "candidate",
        candidate_json: { adapter: "easymap_r02_desktop" },
        cop_response_json: null,
        raw_response_json: { adapter: "easymap_r02_desktop" },
        total_cost_cents: 0,
        cache_hit: false,
        source_run_id: null,
        error_code: "COP312",
        error_message: "candidate discovery failed",
        api_calls: [],
        created_at: "2026-05-25T00:00:00.000Z",
        updated_at: "2026-05-25T00:00:00.000Z",
      },
    ];
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "查詢紀錄" })).toBeInTheDocument();
    expect(await screen.findByText("正式查詢 / 0 元 / 錯誤")).toBeInTheDocument();
    expect(screen.queryByText("試用")).not.toBeInTheDocument();
    expect(screen.queryByText("Helper")).not.toBeInTheDocument();
    expect(screen.queryByText("R02")).not.toBeInTheDocument();
    expect(screen.queryByText("COP312")).not.toBeInTheDocument();
    expect(screen.queryByText("SaaS")).not.toBeInTheDocument();
  });

  it("DevSuperAdmin 在 test 環境不渲染（僅 development 環境可見）", () => {
    render(<SettingsPage />);
    // DevSuperAdmin 檢查 NODE_ENV === 'development'，test 環境不顯示
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });
});
