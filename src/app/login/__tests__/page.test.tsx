import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import LoginPage from "../page";
import { mockInvoke } from "@/lib/mock-backend";

const mockInvokeFn = vi.mocked(mockInvoke);

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders minimal layout — only email, password, login, forgot password", () => {
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

    // login button
    expect(screen.getByRole("button", { name: /登入/ })).toBeInTheDocument();

    // forgot password
    expect(screen.getByText(/忘記密碼/)).toBeInTheDocument();

    // no license/activation/serial key UI
    expect(screen.queryByText(/序號/)).not.toBeInTheDocument();
    expect(screen.queryByText(/啟用/)).not.toBeInTheDocument();
    expect(screen.queryByText(/license/i)).not.toBeInTheDocument();
  });

  it("successful login — calls mockInvoke and redirects to /dashboard", async () => {
    mockInvokeFn.mockResolvedValue({
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
    fireEvent.click(screen.getByRole("button", { name: /登入/ }));

    await waitFor(() => {
      expect(mockInvokeFn).toHaveBeenCalledWith("login", {
        email: "admin@test.aire",
        password: "password",
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("failed login — INVALID_CREDENTIALS shows 帳號或密碼錯誤", async () => {
    mockInvokeFn.mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    render(<LoginPage />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "wrong@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登入/ }));

    await waitFor(() => {
      expect(screen.getByText("帳號或密碼錯誤")).toBeInTheDocument();
    });
  });

  it("failed login — ACCOUNT_EXPIRED shows 帳號已過期", async () => {
    mockInvokeFn.mockRejectedValue(new Error("ACCOUNT_EXPIRED"));

    render(<LoginPage />);

    fireEvent.change(
      (screen.queryByPlaceholderText(/email/i) ??
        document.querySelector('input[type="email"]'))!,
      { target: { value: "expired@example.com" } },
    );
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /登入/ }));

    await waitFor(() => {
      expect(screen.getByText("帳號已過期")).toBeInTheDocument();
    });
  });
});
