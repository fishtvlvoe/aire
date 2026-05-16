import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LandApiSection } from "../LandApiSection";

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import { mockInvoke } from "@/lib/mock-backend";

const mockInvokeFn = vi.mocked(mockInvoke);

describe("LandApiSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeFn.mockResolvedValueOnce({ clientId: "", secret: "" });
  });

  it("預設空值時儲存和測試連線按鈕 disabled", async () => {
    render(<LandApiSection />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Client ID/)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "儲存" })).toBeDisabled();
    const testButton = screen.getByRole("button", { name: "測試連線" });
    expect(testButton).toBeDisabled();
    expect(testButton).toHaveAttribute("title", "請先填入 Client ID 和安全碼");
  });

  it("client id 與安全碼皆有值時，測試連線按鈕啟用且無 tooltip", async () => {
    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/Client ID/));

    fireEvent.change(screen.getByLabelText(/Client ID/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });

    const testButton = screen.getByRole("button", { name: "測試連線" });
    expect(testButton).toBeEnabled();
    expect(testButton).not.toHaveAttribute("title");
  });

  it("填入值後點儲存呼叫 save_land_api_settings", async () => {
    mockInvokeFn.mockResolvedValueOnce({ success: true });

    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/Client ID/));

    fireEvent.change(screen.getByLabelText(/Client ID/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(() => {
      expect(mockInvokeFn).toHaveBeenCalledWith("save_land_api_settings", {
        clientId: "my-client-id",
        secret: "my-secret",
      });
    });
  });

  it("測試連線成功顯示延遲", async () => {
    mockInvokeFn.mockResolvedValueOnce({ success: true, latency_ms: 123 });

    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/Client ID/));

    fireEvent.change(screen.getByLabelText(/Client ID/), {
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
    mockInvokeFn.mockRejectedValueOnce(new Error("連線失敗"));

    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/Client ID/));

    fireEvent.change(screen.getByLabelText(/Client ID/), {
      target: { value: "my-client-id" },
    });
    fireEvent.change(screen.getByLabelText(/安全碼/), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "測試連線" }));

    await waitFor(() => {
      expect(screen.getByText("連線失敗")).toBeInTheDocument();
    });
  });

  it("申請說明與教學影片區塊顯示敬請期待元件", async () => {
    render(<LandApiSection />);

    await waitFor(() => screen.getByLabelText(/Client ID/));

    expect(screen.getAllByText("敬請期待")).toHaveLength(2);
    expect(screen.queryByText("教學影片即將上線")).not.toBeInTheDocument();
  });
});
