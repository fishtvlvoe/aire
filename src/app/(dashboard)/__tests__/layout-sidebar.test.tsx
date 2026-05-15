import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/cases",
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "admin@test.aire", role: "admin" },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/AppSidebar", () => ({
  AppSidebar: ({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) => (
    <button type="button" onClick={onToggle} data-collapsed={collapsed ? "yes" : "no"}>
      toggle
    </button>
  ),
}));

vi.mock("@/components/AppTopbar", () => ({
  AppTopbar: () => <div>topbar</div>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import DashboardLayout from "../layout";

function createMockLocalStorage(seed?: Record<string, string>): Storage {
  const data = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("DashboardLayout sidebar persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMockLocalStorage(),
    });
  });

  it("restores collapsed state from localStorage", async () => {
    window.localStorage.setItem("aire-sidebar-collapsed", "true");

    const { container } = render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    await waitFor(() => {
      expect(container.querySelector("aside")).toHaveClass("md:w-[60px]");
    });
  });

  it("persists collapse toggle to localStorage", async () => {
    const { container, getAllByRole } = render(
      <DashboardLayout>
        <div>content</div>
      </DashboardLayout>,
    );

    fireEvent.click(getAllByRole("button", { name: "toggle" })[0]);

    await waitFor(() => {
      expect(window.localStorage.getItem("aire-sidebar-collapsed")).toBe("true");
      expect(container.querySelector("aside")).toHaveClass("md:w-[60px]");
    });
  });
});
