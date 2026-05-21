"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Folder,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { getDemoSidebarFolders } from "@/lib/product-ui-demo-alignment";
import { cn } from "@/lib/utils";

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
  const folders = getDemoSidebarFolders();
  const folderIcons = [Folder, Database, FileText, Settings];

  return (
    <div className="flex h-full flex-col">
      {/* 導航列表 */}
      <nav aria-label="主要選單" className="flex-1 space-y-3 px-3 py-4">
        {folders.map((folder, index) => {
          const Icon = folderIcons[index] ?? Folder;

          return (
            <section key={folder.label} aria-label={folder.label}>
              <div
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-semibold",
                  collapsed ? "justify-center" : "gap-3",
                )}
                title={collapsed ? folder.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate">{folder.label}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {folder.description}
                    </span>
                  </span>
                ) : null}
              </div>
              {!collapsed ? (
                <div className="ml-7 mt-1 space-y-1">
                  {folder.items.map((item) => {
                    const baseHref = item.href.split("?")[0];
                    const isActive =
                      baseHref === "/cases"
                        ? pathname.startsWith("/cases") && folder.label === "案件管理"
                        : pathname.startsWith(baseHref);

                    return (
                      <Link
                        key={`${folder.label}-${item.label}`}
                        href={item.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
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
