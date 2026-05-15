"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/cases": "案件管理",
  "/settings/branding": "品牌設定",
  "/settings/logs": "操作日誌",
};

function getPageTitle(pathname: string): string {
  // 精確匹配優先
  if (pageTitles[pathname]) return pageTitles[pathname];

  // 前綴匹配
  if (pathname.startsWith("/cases")) return "案件管理";
  if (pathname.startsWith("/settings/branding")) return "品牌設定";
  if (pathname.startsWith("/settings/logs")) return "操作日誌";

  return "AIRE";
}

interface AppTopbarProps {
  onMenuClick: () => void;
  onLogout?: () => void;
  logoutDisabled?: boolean;
}

export function AppTopbar({
  onMenuClick,
  onLogout,
  logoutDisabled = false,
}: AppTopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      {/* 漢堡按鈕 — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="開啟選單"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* 頁面標題 */}
      <h1 className="text-sm font-semibold">{title}</h1>

      {onLogout ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          disabled={logoutDisabled}
          className="ml-auto"
        >
          登出
        </Button>
      ) : null}
    </header>
  );
}
