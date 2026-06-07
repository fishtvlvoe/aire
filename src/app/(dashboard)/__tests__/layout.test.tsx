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

vi.mock("@/lib/aire-saas-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/aire-saas-session")>("@/lib/aire-saas-session");
  return {
    ...actual,
    getAireBrowserReturnUrl: vi.fn(() => "https://aire-browser.opcos.me/cases"),
  };
});

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
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated browser users to /login with returnTo (stays on browser domain)", async () => {
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
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?returnTo=https%3A%2F%2Faire-browser.opcos.me%2Fcases",
      );
    });
  });

  it("preserves returnTo path in redirect URL", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: mockLogout,
    });

    const module = await import("@/lib/aire-saas-session");
    const tracked = vi.mocked(module.getAireBrowserReturnUrl);
    tracked.mockReturnValue("https://aire-browser.opcos.me/cases/new");

    render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?returnTo=https%3A%2F%2Faire-browser.opcos.me%2Fcases%2Fnew",
      );
    });
  });

  it("renders dashboard shell for authenticated users", async () => {
    mockUseAuth.mockReturnValue({
      user: { email: "admin@test.aire", role: "admin" },
      workspace: {
        id: "workspace-abc",
        licenseStatus: "active",
        availableSerialCount: 2,
        boundDeviceCount: 1,
      },
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
      expect(screen.getByText("AIRE 工作區：workspace-abc")).toBeInTheDocument();
      expect(screen.getByText("可用序號數：2")).toBeInTheDocument();
      expect(screen.getByText("已綁定設備：1")).toBeInTheDocument();
    });
  });

  it("calls logout and redirects to /login with returnTo", async () => {
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
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?returnTo=https%3A%2F%2Faire-browser.opcos.me%2Fcases",
      );
    });
  });
});
