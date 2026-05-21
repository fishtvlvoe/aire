"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "案件管理", href: "/cases", icon: FileText },
  { label: "設定", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  showCollapseToggle?: boolean;
  userName?: string;
}

export function AppSidebar({
  collapsed = false,
  onToggle,
  showCollapseToggle = true,
  userName = "余啟彰",
}: AppSidebarProps) {
  const pathname = usePathname();
  const userInitial = userName.trim().slice(0, 1) || "個";

  return (
    <div className="flex h-full flex-col">
      {/* 導航列表 */}
      <nav aria-label="主要選單" className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/cases"
              ? pathname.startsWith("/cases")
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? label : null}
            </Link>
          );
        })}
      </nav>

      {/* 底部個人設定 */}
      <div className={cn("border-t px-3 py-3", collapsed ? "space-y-3" : "space-y-2")}>
        {!collapsed ? (
          <Link
            href="/settings"
            aria-label={`個人設定 ${userName}`}
            className="flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
              {userInitial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {userName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">個人設定</span>
            </span>
            <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            href="/settings"
            aria-label={`個人設定 ${userName}`}
            title="個人設定"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {userInitial}
          </Link>
        )}

        {showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
            className={cn(
              "inline-flex w-full items-center justify-center rounded-md border p-1 text-muted-foreground hover:bg-muted",
              collapsed ? "mx-auto h-8 w-8 p-0" : "h-8",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
