"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { Toaster } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const SIDEBAR_COLLAPSE_KEY = "aire-sidebar-collapsed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      setSidebarCollapsed(value === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleToggleSidebar() {
    setSidebarCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // ignore localStorage failure
      }
      return next;
    });
  }

  // Session 驗證中 → 顯示 loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  // 未登入 → guard 已觸發 redirect，渲染空節點避免閃爍
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile, 200ms transition */}
      <aside
        className={`hidden md:flex md:flex-col md:border-r transition-[width] duration-200 ease-in-out ${
          sidebarCollapsed ? "md:w-[60px]" : "md:w-60"
        }`}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          showCollapseToggle
        />
      </aside>

      {/* Mobile sidebar — Sheet 滑出 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AppSidebar
            collapsed={false}
            onToggle={handleToggleSidebar}
            showCollapseToggle={false}
          />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          logoutDisabled={isLoggingOut}
        />
        <BrowserMockStateNotice />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

function BrowserMockStateNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inBrowserMock =
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      !("__TAURI_INTERNALS__" in window);
    setVisible(inBrowserMock);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900" role="status">
      本瀏覽器本機測試資料
      <span className="ml-2 font-normal text-amber-800">
        不同瀏覽器或不同 Chrome profile 不會自動同步；可用資料來源頁下載 JSON 對齊測試資料，重置請清除 localStorage 的 aire-mock-store。正式交付請以桌面 App 或共享後端資料為準。
      </span>
    </div>
  );
}
