"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
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
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentHref = search ? `${pathname}?${search}` : pathname;
  const userInitial = userName.trim().slice(0, 1) || "個";
  const folders = getDemoSidebarFolders();
  const folderIcons = [Folder, Database, Settings];
  const activeFolderLabel = useMemo(() => {
    if (pathname === "/settings" && !search) {
      return "系統設定";
    }

    let bestMatch: { label: string; score: number } | null = null;

    for (const folder of folders) {
      for (const item of folder.items) {
        const baseHref = item.href.split("?")[0];
        const score =
          currentHref === item.href
            ? 1000 + item.href.length
            : pathname === baseHref || pathname.startsWith(`${baseHref}/`)
              ? baseHref.length
              : 0;

        if (score > (bestMatch?.score ?? 0)) {
          bestMatch = { label: folder.label, score };
        }
      }
    }

    return bestMatch?.label ?? folders[0]?.label;
  }, [currentHref, folders, pathname]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(
    () => new Set(activeFolderLabel ? [activeFolderLabel] : []),
  );

  useEffect(() => {
    if (!activeFolderLabel) return;
    setOpenFolders((current) => {
      if (current.has(activeFolderLabel)) return current;
      const next = new Set(current);
      next.add(activeFolderLabel);
      return next;
    });
  }, [activeFolderLabel]);

  function toggleFolder(folderLabel: string) {
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(folderLabel)) {
        next.delete(folderLabel);
      } else {
        next.add(folderLabel);
      }
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* 導航列表 */}
      <nav aria-label="主要選單" className="flex-1 space-y-3 px-3 py-4">
        {folders.map((folder, index) => {
          const Icon = folderIcons[index] ?? Folder;
          const isOpen = openFolders.has(folder.label);
          const submenuId = `sidebar-folder-${folder.label}`;

          return (
            <section key={folder.label} aria-label={folder.label}>
              {collapsed ? (
                <div
                  className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold"
                  title={folder.label}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ) : (
                <button
                  type="button"
                  aria-controls={submenuId}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "收合" : "展開"}${folder.label}選單`}
                  onClick={() => toggleFolder(folder.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-muted",
                    activeFolderLabel === folder.label && "bg-muted/70",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{folder.label}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {folder.description}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              )}
              {!collapsed && isOpen ? (
                <div id={submenuId} className="ml-7 mt-1 space-y-1">
                  {folder.items.map((item) => {
                    const isActive = currentHref === item.href;

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
