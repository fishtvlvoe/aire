import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LandApiSection } from "../LandApiSection";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/lib/land-registry-api", () => ({
  getApiKey: vi.fn(),
  setApiKey: vi.fn(),
  testConnection: vi.fn(),
}));

import { mockInvoke } from "@/lib/mock-backend";
import { getApiKey, setApiKey, testConnection } from "@/lib/land-registry-api";

const mockInvokeFn = vi.mocked(mockInvoke);
const mockGetApiKey = vi.mocked(getApiKey);
const mockSetApiKey = vi.mocked(setApiKey);
const mockTestConnection = vi.mocked(testConnection);

describe("LandApiSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiKey.mockResolvedValue(null);
    mockSetApiKey.mockResolvedValue(undefined);
    mockTestConnection.mockResolvedValue({ success: true, message: "連線成功", latency_ms: 123 } as never);
  });

  it("預設空值時儲存和測試連線按鈕 disabled", async () => {
    render(<LandApiSection />);

    await waitFor(() => {
      expect(screen.getByLabelText(/帳號識別碼/)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "儲存" })).toBeDisabled();
    const testButton = screen.getByRole("button", { name: "測試連線" });
    expect(testButton).toBeDisabled();
    expect(testButton).toHaveAttribute("title", "請先填入帳號識別碼和安全碼");
  });

  it("client id 與安全碼皆有值時，測試連線按鈕啟用且無 tooltip", async () => {
    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/帳號識別碼/));

    fireEvent.change(screen.getByLabelText(/帳號識別碼/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });

    const testButton = screen.getByRole("button", { name: "測試連線" });
    expect(testButton).toBeEnabled();
    expect(testButton).not.toHaveAttribute("title");
  });

  it("填入值後點儲存只呼叫正式地政金鑰 bridge，不寫 mock settings", async () => {
    mockGetApiKey.mockResolvedValueOnce(null).mockResolvedValueOnce({
      client_id_masked: "****t-id",
      has_secret: true,
    });

    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/帳號識別碼/));

    fireEvent.change(screen.getByLabelText(/帳號識別碼/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(() => {
      expect(mockSetApiKey).toHaveBeenCalledWith("my-client-id", "my-secret");
      expect(mockInvokeFn).not.toHaveBeenCalledWith("save_land_api_settings", expect.anything());
      expect(screen.getByText("已儲存地政查詢帳號")).toBeInTheDocument();
      expect(screen.getByText("****t-id")).toBeInTheDocument();
    });
  });

  it("已有 keychain 設定時可不重填安全碼直接測試連線", async () => {
    mockGetApiKey.mockResolvedValueOnce({
      client_id_masked: "****efd5",
      has_secret: true,
    });

    render(<LandApiSection />);

    await waitFor(() => {
      expect(screen.getByText("已儲存地政查詢帳號")).toBeInTheDocument();
    });

    const testButton = screen.getByRole("button", { name: "測試連線" });
    expect(testButton).toBeEnabled();
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockSetApiKey).not.toHaveBeenCalled();
      expect(mockTestConnection).toHaveBeenCalled();
    });
  });

  it("測試連線成功顯示延遲", async () => {
    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/帳號識別碼/));

    fireEvent.change(screen.getByLabelText(/帳號識別碼/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "測試連線" }));

    await waitFor(() => {
      expect(screen.getByText(/連線成功/)).toBeInTheDocument();
      expect(screen.getByText(/123ms/)).toBeInTheDocument();
    });
  });

  it("測試連線失敗顯示連線失敗", async () => {
    mockTestConnection.mockResolvedValueOnce({ success: false, message: "認證失敗" });

    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/帳號識別碼/));

    fireEvent.change(screen.getByLabelText(/帳號識別碼/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "測試連線" }));

    await waitFor(() => {
      expect(screen.getByText("認證失敗")).toBeInTheDocument();
    });
  });

  it("申請說明顯示地政註冊連結，教學影片仍為敬請期待", async () => {
    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/帳號識別碼/));

    expect(screen.getByText("請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往地政註冊" })).toHaveAttribute(
      "href",
      "https://cop.moi.gov.tw/Register",
    );
    expect(screen.getAllByText("敬請期待")).toHaveLength(1);
    expect(screen.queryByText("教學影片即將上線")).not.toBeInTheDocument();
  });
});
