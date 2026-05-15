import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
const mockLogout = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/cases",
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="sidebar">sidebar</div>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import DashboardLayout from "../layout";
import { useAuth } from "@/hooks/useAuth";

const mockUseAuth = vi.mocked(useAuth);

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders dashboard shell for authenticated users", async () => {
    mockUseAuth.mockReturnValue({
      user: { email: "admin@test.aire", role: "admin" },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("sidebar")).toHaveLength(2);
      expect(screen.getByText("content")).toBeInTheDocument();
    });
  });

  it("calls logout and redirects to /login", async () => {
    mockLogout.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { email: "admin@test.aire", role: "admin" },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "登出" }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });
});
