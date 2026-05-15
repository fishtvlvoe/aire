import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
const mockLogin = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import LoginPage from "../page";
import { useAuth } from "@/hooks/useAuth";

const mockUseAuth = vi.mocked(useAuth);

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  it("renders login form elements", () => {
    render(<LoginPage />);

    expect(screen.getByText("不動產說明書自動化系統")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("密碼")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登入" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "忘記密碼？" })).toBeInTheDocument();
    expect(screen.getByAltText("AIRE Logo")).toBeInTheDocument();
  });

  it("submits valid credentials and redirects to /cases", async () => {
    mockLogin.mockResolvedValue({ email: "admin@test.aire", role: "admin" });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "admin@test.aire" },
    });
    fireEvent.change(screen.getByPlaceholderText("密碼"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@test.aire", "password");
      expect(mockReplace).toHaveBeenCalledWith("/cases");
    });
  });

  it("maps login errors to Chinese messages", async () => {
    mockLogin.mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("密碼"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() => {
      expect(
        screen.getByText("帳號或密碼錯誤，請重新輸入"),
      ).toBeInTheDocument();
    });
  });

  it("validates empty fields and does not call login", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "登入" }));

    await waitFor(() => {
      expect(screen.getByText("請輸入 Email")).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it("redirects when already authenticated", async () => {
    mockUseAuth.mockReturnValue({
      user: { email: "admin@test.aire", role: "admin" },
      isLoading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: vi.fn(),
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/cases");
    });
  });
});
