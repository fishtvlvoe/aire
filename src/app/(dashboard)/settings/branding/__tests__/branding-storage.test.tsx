/**
 * TDD: Bug#5 品牌設定持久化
 * saveBranding → storage.saveBranding 被呼叫
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// mock storage
vi.mock("@/lib/storage", () => ({
  storage: {
    getBranding: vi.fn().mockResolvedValue(null),
    saveBranding: vi.fn().mockResolvedValue(undefined),
  },
}));

// mock tauri-bridge — return true so BrandingContent renders the form
vi.mock("@/lib/tauri-bridge", () => ({
  isTauriEnv: vi.fn().mockResolvedValue(true),
  safeInvoke: vi.fn().mockResolvedValue(null),
}));

// mock LogoUploader, ThemeSelector, TauriRequired to avoid dependencies
vi.mock("@/components/LogoUploader", () => ({ LogoUploader: () => null }));
vi.mock("@/components/ThemeSelector", () => ({ ThemeSelector: () => null }));
vi.mock("@/components/TauriRequired", () => ({ TauriRequired: () => null }));
vi.mock("@/lib/pdf-themes/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { storage } from "@/lib/storage";
import BrandingContent from "../branding-content";

beforeEach(() => {
  vi.clearAllMocks();
  (storage.getBranding as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (storage.saveBranding as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe("BrandingContent — Bug#5 持久化", () => {
  it("mount 時呼叫 storage.getBranding()", async () => {
    render(<BrandingContent />);
    await waitFor(() => {
      expect(storage.getBranding).toHaveBeenCalled();
    });
  });

  it("有既有品牌資料時預填公司名稱欄位", async () => {
    (storage.getBranding as ReturnType<typeof vi.fn>).mockResolvedValue({
      companyName: "大安不動產",
    });
    render(<BrandingContent />);
    await waitFor(() => {
      const input = screen.getByLabelText("不動產經紀業") as HTMLInputElement;
      expect(input.value).toBe("大安不動產");
    });
  });

  it("顯示固定交付資訊需要的七個欄位", async () => {
    render(<BrandingContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("承辦人")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("經紀人")).toBeInTheDocument();
    expect(screen.getByLabelText("經紀人證號")).toBeInTheDocument();
    expect(screen.getByLabelText("不動產經紀業")).toBeInTheDocument();
    expect(screen.getByLabelText("經紀業證號")).toBeInTheDocument();
    expect(screen.getByLabelText("公司地址")).toBeInTheDocument();
    expect(screen.getByLabelText("公司電話")).toBeInTheDocument();
    expect(screen.queryByLabelText("業務員證號")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("公司名稱")).not.toBeInTheDocument();
  });

  it("點儲存後呼叫 storage.saveBranding()", async () => {
    render(<BrandingContent />);
    await waitFor(() => screen.getByRole("button", { name: /儲存品牌資訊/ }));
    await userEvent.click(screen.getByRole("button", { name: /儲存品牌資訊/ }));
    await waitFor(() => {
      expect(storage.saveBranding).toHaveBeenCalled();
    });
  });
});
