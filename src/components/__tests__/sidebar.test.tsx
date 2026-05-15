import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock useAuth 讓 layout 不需真正的 session
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "admin@test.aire", role: "admin" },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock Sheet 元件（避免 Radix 相依問題）
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { AppSidebar } from "@/components/AppSidebar";

const SIDEBAR_COLLAPSE_KEY = "aire-sidebar-collapsed";

// localStorage mock（jsdom 環境可能未提供）
function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe("側邊欄收合功能", () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("收合按鈕存在", () => {
    render(<AppSidebar collapsed={false} onToggle={vi.fn()} showCollapseToggle />);
    const toggle = screen.getByRole("button", { name: /收合側邊欄/ });
    expect(toggle).toBeInTheDocument();
  });

  it("點擊收合 → onToggle 被呼叫", () => {
    const onToggle = vi.fn();
    render(<AppSidebar collapsed={false} onToggle={onToggle} showCollapseToggle />);

    const toggle = screen.getByRole("button", { name: /收合側邊欄/ });
    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("收合狀態下顯示展開按鈕", () => {
    render(<AppSidebar collapsed onToggle={vi.fn()} showCollapseToggle />);
    const toggle = screen.getByRole("button", { name: /展開側邊欄/ });
    expect(toggle).toBeInTheDocument();
  });

  it("收合狀態存入 localStorage key aire-sidebar-collapsed", async () => {
    // 透過 dashboard layout 驗證 localStorage 持久化
    const { default: DashboardLayout } = await import(
      "@/app/(dashboard)/layout"
    );
    render(
      <DashboardLayout>
        <div>test content</div>
      </DashboardLayout>,
    );

    // 找到收合按鈕（desktop sidebar 裡的）
    const toggles = screen.getAllByRole("button", { name: /收合側邊欄/ });
    fireEvent.click(toggles[0]);

    expect(storageMock.setItem).toHaveBeenCalledWith(
      SIDEBAR_COLLAPSE_KEY,
      "true",
    );
  });

  it("重載時從 localStorage 恢復收合狀態", async () => {
    // 先設定 localStorage 為收合
    storageMock.getItem.mockReturnValue("true");

    const { default: DashboardLayout } = await import(
      "@/app/(dashboard)/layout"
    );
    render(
      <DashboardLayout>
        <div>test content</div>
      </DashboardLayout>,
    );

    // 應該顯示「展開側邊欄」按鈕（代表目前是收合狀態）
    const toggles = screen.getAllByRole("button", { name: /展開側邊欄/ });
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });
});
