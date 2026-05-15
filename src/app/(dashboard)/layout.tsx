"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLicenseStatus } from "@/hooks/useLicenseStatus";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status, isLoading } = useLicenseStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && status !== "valid") {
      router.replace("/activation");
    }
  }, [status, isLoading, router]);

  // License 驗證中 → 顯示 loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  // 授權無效 → guard 已觸發 redirect，渲染空節點避免閃爍
  if (status !== "valid") return null;

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r">
        <AppSidebar />
      </aside>

      {/* Mobile sidebar — Sheet 滑出 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
