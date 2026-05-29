import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  exchangeDesktopBootstrapCode: vi.fn(),
}));

import LoginPage from "../page";
import { exchangeDesktopBootstrapCode, login } from "@/lib/auth";

const mockLogin = vi.mocked(login);
const mockBootstrap = vi.mocked(exchangeDesktopBootstrapCode);

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders desktop account layout with password help", () => {
    render(<LoginPage />);

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

    // forgot password
    expect(screen.getByRole("link", { name: "忘記密碼" })).toHaveAttribute(
      "href",
      "https://opcos.me/forgot-password",
    );
    expect(screen.getByText("登入 AIRE 桌面版")).toBeInTheDocument();
    expect(screen.getByText("使用 AIRE 桌面版帳號登入。Google 或 LINE 購買用戶請改用一次性登入碼。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "取得桌面登入碼" })).toHaveAttribute(
      "href",
      "https://opcos.me/products/aire?intent=desktop-login",
    );
    expect(screen.getByRole("link", { name: "建立帳號或購買" })).toHaveAttribute(
      "href",
      "https://opcos.me/products/aire",
    );

    // no license/activation/serial key UI
    expect(screen.queryByText(/序號/)).not.toBeInTheDocument();
    expect(screen.queryByText(/啟用/)).not.toBeInTheDocument();
    expect(screen.queryByText(/license/i)).not.toBeInTheDocument();
  });

  it("supports bootstrap code login and redirects to /cases/new", async () => {
    mockBootstrap.mockResolvedValue({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
      bootstrapOnly: true,
    });
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("tab", { name: "一次性登入碼" }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("一次性桌面登入碼")).toBeInTheDocument();
    });

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "admin@test.aire" } },
    );
    fireEvent.change(screen.getByPlaceholderText("一次性桌面登入碼"), {
      target: { value: "OTC-ADMIN-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "使用桌面碼" }));

    await waitFor(() => {
      expect(mockBootstrap).toHaveBeenCalledWith("admin@test.aire", "OTC-ADMIN-2026");
      expect(mockPush).toHaveBeenCalledWith("/cases/new");
    });
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);

    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "顯示密碼" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "隱藏密碼" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "隱藏密碼" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("successful login — calls auth login and redirects to /cases/new", async () => {
    mockLogin.mockResolvedValue({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
    });

    render(<LoginPage />);

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
      expect(mockLogin).toHaveBeenCalledWith("admin@test.aire", "password");
      expect(mockPush).toHaveBeenCalledWith("/cases/new");
    });
  });

  it("empty submit shows explicit desktop account error", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /^登入$/ }));

    expect(screen.getByText("請輸入 AIRE 桌面版帳號與密碼")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("bootstrap login requires email and code", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("tab", { name: "一次性登入碼" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "使用桌面碼" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "使用桌面碼" }));

    expect(screen.getByText("請輸入 Email 與一次性桌面登入碼")).toBeInTheDocument();
    expect(mockBootstrap).not.toHaveBeenCalled();
  });

  it("failed login — INVALID_CREDENTIALS shows 帳號或密碼錯誤", async () => {
    mockLogin.mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    render(<LoginPage />);

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
    mockLogin.mockRejectedValue(new Error("ACCOUNT_EXPIRED"));

    render(<LoginPage />);

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
});
