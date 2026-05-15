import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn(),
}));

import SettingsPage from "../page";
import { safeInvoke } from "@/lib/tauri-bridge";

const mockSafeInvoke = vi.mocked(safeInvoke);

describe("Settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "none", serial_key: null };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "none", serialKey: null },
          landApi: { clientId: "", secret: "" },
          premiumUnlocked: false,
        };
      }
      return { success: true };
    });
  });

  it("renders license section for non-activated status", async () => {
    render(<SettingsPage />);

    expect(await screen.findByText("序號管理")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AIRE-XXXX-XXXX-XXXX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "啟動授權" })).toBeInTheDocument();
  });

  it("activates license and shows active status", async () => {
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "none", serial_key: null };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "none", serialKey: null },
          landApi: { clientId: "", secret: "" },
          premiumUnlocked: false,
        };
      }
      if (cmd === "activate_license") {
        return { success: true };
      }
      return { success: true };
    });

    render(<SettingsPage />);

    fireEvent.change(await screen.findByPlaceholderText("AIRE-XXXX-XXXX-XXXX"), {
      target: { value: "AIRE-TEST-VALID-001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "啟動授權" }));

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledWith("activate_license", {
        serial_key: "AIRE-TEST-VALID-001",
      });
      expect(screen.getByText("已啟動")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "解除授權" })).toBeInTheDocument();
    });
  });

  it("maps activation errors", async () => {
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "none", serial_key: null };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "none", serialKey: null },
          landApi: { clientId: "", secret: "" },
          premiumUnlocked: false,
        };
      }
      if (cmd === "activate_license") {
        throw new Error("INVALID_KEY");
      }
      return { success: true };
    });

    render(<SettingsPage />);

    fireEvent.change(await screen.findByPlaceholderText("AIRE-XXXX-XXXX-XXXX"), {
      target: { value: "invalid-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "啟動授權" }));

    await waitFor(() => {
      expect(screen.getByText("序號無效，請確認輸入是否正確")).toBeInTheDocument();
    });
  });

  it("renders active license and supports deactivation", async () => {
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "valid", serial_key: "AIRE-TEST-VALID-001" };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "valid", serialKey: "AIRE-TEST-VALID-001" },
          landApi: { clientId: "", secret: "" },
          premiumUnlocked: false,
        };
      }
      return { success: true };
    });

    render(<SettingsPage />);

    expect(await screen.findByText("已啟動")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "解除授權" }));

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledWith("deactivate_license", undefined);
      expect(screen.getByRole("button", { name: "啟動授權" })).toBeInTheDocument();
    });
  });

  it("renders land API section and pre-populates values", async () => {
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "none", serial_key: null };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "none", serialKey: null },
          landApi: { clientId: "existing-client", secret: "existing-secret" },
          premiumUnlocked: false,
        };
      }
      return { success: true };
    });

    render(<SettingsPage />);

    expect(await screen.findByText("地政 API 設定")).toBeInTheDocument();
    expect(screen.getByDisplayValue("existing-client")).toBeInTheDocument();
    expect(screen.getByLabelText("安全碼")).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "如何申請地政 API？" })).toBeInTheDocument();
    expect(screen.getByTitle("地政 API 教學影片")).toBeInTheDocument();
  });

  it("saves land API settings", async () => {
    render(<SettingsPage />);

    fireEvent.change(await screen.findByLabelText("Client ID"), {
      target: { value: "test-client-123" },
    });
    fireEvent.change(screen.getByLabelText("安全碼"), {
      target: { value: "test-secret-456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledWith("save_app_settings", {
        landApi: { clientId: "test-client-123", secret: "test-secret-456" },
      });
      expect(screen.getByText("設定已儲存")).toBeInTheDocument();
    });
  });

  it("renders premium locked and opens OPCOS URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<SettingsPage />);

    expect(await screen.findByText("進階功能")).toBeInTheDocument();
    expect(screen.getByText("實價登錄 MCP Hub — 月費訂閱")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "前往 OPCOS 開通" }));

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("renders premium unlocked state", async () => {
    mockSafeInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_license_status") {
        return { status: "none", serial_key: null };
      }
      if (cmd === "get_app_settings") {
        return {
          license: { status: "none", serialKey: null },
          landApi: { clientId: "", secret: "" },
          premiumUnlocked: true,
        };
      }
      return { success: true };
    });

    render(<SettingsPage />);

    expect(await screen.findByText("實價登錄 MCP Hub — 已開通")).toBeInTheDocument();
  });
});
