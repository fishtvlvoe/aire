"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "案件管理", href: "/cases", icon: FileText },
  { label: "品牌設定", href: "/settings/branding", icon: Palette },
  { label: "日誌", href: "/settings/logs", icon: ScrollText },
  { label: "設定", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  showCollapseToggle?: boolean;
}

export function AppSidebar({
  collapsed = false,
  onToggle,
  showCollapseToggle = true,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* 導航列表 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
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

      {/* 底部 App 資訊 */}
      <div className={cn("border-t px-4 py-3", collapsed ? "space-y-3" : "space-y-1")}>
        {!collapsed ? (
          <>
            <p className="text-sm font-semibold text-foreground">AIRE</p>
            <p className="text-xs text-muted-foreground">v0.1.0</p>
          </>
        ) : (
          <p className="text-center text-xs font-semibold text-foreground">A</p>
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
