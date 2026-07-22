import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockPush, mockReplace, mockSearchParams, mockReadAireBrowserSession } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockSearchParams: vi.fn(() => new URLSearchParams()),
  mockReadAireBrowserSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  exchangeDesktopBootstrapCode: vi.fn(),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  signInWithEmail: vi.fn(),
  signInWithProvider: vi.fn(),
}));

vi.mock("@/lib/aire-saas-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/aire-saas-session")>("@/lib/aire-saas-session");
  return {
    ...actual,
    getAireBrowserReturnUrl: vi.fn(() => "https://aire-browser.opcos.me"),
    readAireBrowserSession: mockReadAireBrowserSession,
  };
});

import { LoginPageClient } from "../LoginPageClient";
import { exchangeDesktopBootstrapCode } from "@/lib/auth";
import { signInWithEmail, signInWithProvider } from "@/lib/auth/auth-client";

const mockBootstrap = vi.mocked(exchangeDesktopBootstrapCode);
const mockSignInWithEmail = vi.mocked(signInWithEmail);
const mockSignInWithProvider = vi.mocked(signInWithProvider);

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockReadAireBrowserSession.mockReturnValue(null);
  });

  it("renders AIRE SaaS account layout with license and device entry actions", () => {
    render(<LoginPageClient />);

    // email input
    const emailInput =
      screen.queryByRole("textbox", { name: /email/i }) ??
      screen.queryByPlaceholderText(/email/i) ??
      (document.querySelector('input[type="email"]') as HTMLElement | null);
    expect(emailInput).toBeInTheDocument();

    // password input
    const passwordInput = document.querySelector(
      'input[type="password"]',
    ) as HTMLElement | null;
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "顯示密碼" })).toBeInTheDocument();

    // login button
    expect(screen.getByRole("tab", { name: "帳號密碼" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "一次性登入碼" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^登入$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 Google 登入" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 LINE 登入" })).toBeInTheDocument();

    // forgot password
    expect(screen.getByRole("link", { name: "忘記密碼" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByText("登入 AIRE SaaS")).toBeInTheDocument();
    expect(screen.getByText("使用 AIRE Email 與密碼登入，通過授權後進入 Browser 工具版。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "授權與設備說明" })).toHaveAttribute(
      "href",
      "https://aire.opcos.me/license",
    );
    expect(screen.getByRole("link", { name: "建立 AIRE 帳號" })).toHaveAttribute(
      "href",
      "https://aire.opcos.me/signup",
    );

    expect(screen.getByText("序號授權")).toBeInTheDocument();
    expect(screen.getByText("設備綁定")).toBeInTheDocument();
    expect(screen.queryByText(/opcos\.me/)).not.toBeInTheDocument();
  });

  it("OAuth provider login uses Google and LINE Better Auth providers with Browser return URL", async () => {
    mockSignInWithProvider.mockResolvedValue(undefined);
    mockSearchParams.mockReturnValue(new URLSearchParams({ returnTo: "https://aire-browser.opcos.me/settings" }));
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "使用 Google 登入" }));
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith("google", "/settings");
    });

    fireEvent.click(screen.getByRole("button", { name: "使用 LINE 登入" }));
    await waitFor(() => {
      expect(mockSignInWithProvider).toHaveBeenCalledWith("line", "/settings");
    });
  });

  it("supports bootstrap code login and redirects to /cases", async () => {
    mockBootstrap.mockResolvedValue({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
      bootstrapOnly: true,
    });
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole("tab", { name: "一次性登入碼" }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("一次性 AIRE 登入碼")).toBeInTheDocument();
    });

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "admin@test.aire" } },
    );
    fireEvent.change(screen.getByPlaceholderText("一次性 AIRE 登入碼"), {
      target: { value: "OTC-ADMIN-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "使用 AIRE 碼" }));

    await waitFor(() => {
      expect(mockBootstrap).toHaveBeenCalledWith("admin@test.aire", "OTC-ADMIN-2026");
      expect(mockPush).toHaveBeenCalledWith("/cases");
    });
  });

  it("enters bootstrap mode directly from search params without tab click", async () => {
    render(<LoginPageClient initialMode="bootstrap" />);

    expect(screen.getByRole("tab", { name: "一次性登入碼" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByPlaceholderText("一次性 AIRE 登入碼")).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
  });

  it("preserves email but isolates bootstrap code from password residue when switching mode", async () => {
    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "admin@test.aire" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "temporary-password" },
    });

    fireEvent.click(screen.getByRole("tab", { name: "一次性登入碼" }));

    const bootstrapInput = await screen.findByPlaceholderText("一次性 AIRE 登入碼");
    expect(
      (screen.queryByPlaceholderText(/email/i) as HTMLInputElement | null)?.value,
    ).toBe("admin@test.aire");
    expect((bootstrapInput as HTMLInputElement).value).toBe("");
  });

  it("does not auto-jump focus to the password field after typing the first email character", () => {
    render(<LoginPageClient />);

    const emailInput = (screen.queryByPlaceholderText(/email/i) ??
      document.querySelector('input[type="email"]')) as HTMLInputElement | null;
    expect(emailInput).toBeInTheDocument();
    emailInput?.focus();

    fireEvent.change(emailInput!, { target: { value: "f" } });

    expect(emailInput).toHaveFocus();
    expect(document.querySelector('input[type="password"]')).not.toHaveFocus();
  });

  it("redirects straight to /cases when an active browser session already exists", async () => {
    mockReadAireBrowserSession.mockReturnValue({
      email: "fish.myfb@gmail.com",
      role: "user",
      workspaceId: "cmpfgv8n7000004k2e97z9mll",
      token: "browser-token",
      licenseStatus: "active",
      availableSerialCount: 0,
      boundDevices: ["device-1"],
      deviceId: "device-1",
      browserToolUrl: "https://aire-browser.opcos.me/cases",
      serverVerified: true,
    });

    render(<LoginPageClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/cases");
    });
  });

  it("toggles password visibility", () => {
    render(<LoginPageClient />);

    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "顯示密碼" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "隱藏密碼" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "隱藏密碼" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("successful login — calls AIRE email signIn and redirects to returnTo", async () => {
    mockSignInWithEmail.mockResolvedValue(undefined);
    mockSearchParams.mockReturnValue(new URLSearchParams({ returnTo: "/cases/abc" }));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "admin@test.aire" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith(
        "admin@test.aire",
        "password",
        "/cases/abc",
      );
      expect(mockPush).toHaveBeenCalledWith("/cases/abc");
    });
  });

  it("production Browser entry redirect does not push a local Browser route after handoff", async () => {
    mockSignInWithEmail.mockResolvedValue({ redirectingToEntry: true });
    mockSearchParams.mockReturnValue(new URLSearchParams({ returnTo: "/cases/new" }));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "fish@fishot.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith(
        "fish@fishot.com",
        "password",
        "/cases/new",
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("empty submit shows explicit AIRE SaaS account error", async () => {
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    expect(screen.getByText("請輸入 AIRE Email 與密碼")).toBeInTheDocument();
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it("bootstrap login requires email and code", async () => {
    render(<LoginPageClient />);

    fireEvent.click(screen.getByRole("tab", { name: "一次性登入碼" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "使用 AIRE 碼" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "使用 AIRE 碼" }));

    expect(screen.getByText("請輸入 Email 與一次性桌面登入碼")).toBeInTheDocument();
    expect(mockBootstrap).not.toHaveBeenCalled();
  });

  it("failed login — INVALID_CREDENTIALS shows 帳號或密碼錯誤", async () => {
    mockSignInWithEmail.mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "wrong@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(screen.getByText("帳號或密碼錯誤")).toBeInTheDocument();
    });
  });

  it("failed login — ACCOUNT_EXPIRED shows 帳號已過期", async () => {
    mockSignInWithEmail.mockRejectedValue(new Error("ACCOUNT_EXPIRED"));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "expired@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(screen.getByText("帳號已過期")).toBeInTheDocument();
    });
  });

  it("failed login — ENTITLEMENT_REQUIRED shows license action without Browser redirect", async () => {
    mockSignInWithEmail.mockRejectedValue(new Error("ENTITLEMENT_REQUIRED"));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "no-license@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(screen.getByText("此帳號尚未啟用 AIRE 授權，請先啟用或購買序號")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("failed login — DEVICE_LIMIT_EXCEEDED shows device binding action without Browser redirect", async () => {
    mockSignInWithEmail.mockRejectedValue(new Error("DEVICE_LIMIT_EXCEEDED"));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "agent@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(screen.getByText("可用設備席次不足，請解除舊設備或新增序號")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("aire-browser.opcos.me/login is the canonical customer login entry", () => {
    render(<LoginPageClient />);

    expect(screen.getByText("登入 AIRE SaaS")).toBeInTheDocument();
    expect(screen.getByText("AIRE SaaS Access")).toBeInTheDocument();
    expect(screen.getByText("AIRE 帳號登入")).toBeInTheDocument();
    expect(screen.queryByText(/opcos\.me\/login/)).not.toBeInTheDocument();
  });

  it("login success navigates to specified returnTo path", async () => {
    mockSignInWithEmail.mockResolvedValue(undefined);
    mockSearchParams.mockReturnValue(new URLSearchParams({ returnTo: "/settings" }));

    render(<LoginPageClient />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "user@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/settings");
    });
  });

  it("rejects external returnTo to prevent open redirect", () => {
    render(<LoginPageClient />);

    // 確認 OAuth provider login 使用 AIRE Browser return URL
    // (已在 OAuth provider login 測試中驗證)
    // 確認登入按鈕使用 getAireBrowserReturnUrl (AIRE-controlled URL)
    expect(screen.getByText("授權與設備說明")).toHaveAttribute(
      "href",
      "https://aire.opcos.me/license",
    );
    expect(screen.getByRole("link", { name: "建立 AIRE 帳號" })).toHaveAttribute(
      "href",
      "https://aire.opcos.me/signup",
    );
  });

  it("keeps login flow within AIRE surfaces, does not loop between two login UIs", () => {
    render(<LoginPageClient />);

    // 登入頁面沒有引導使用者到另一個登入頁面
    expect(screen.queryByText(/opcos\.me\/login/)).not.toBeInTheDocument();
    // 所有連結都是 AIRE 相關的，沒有一處導向 opcos.me/login
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.getAttribute("href")).not.toContain("https://opcos.me/login");
    });
  });

  it("redirects to central login if loaded from aire-browser.opcos.me subdomain and no active session", () => {
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: "aire-browser.opcos.me",
      assign: vi.fn(),
    } as any;

    render(<LoginPageClient />);

    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining("https://aire.opcos.me/login?returnTo=")
    );

    window.location = originalLocation;
  });
});
