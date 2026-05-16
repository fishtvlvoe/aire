"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { label: "一般設定", href: "/settings" },
  { label: "品牌設定", href: "/settings/branding" },
  { label: "操作日誌", href: "/settings/logs" },
] as const;

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/settings") {
    return pathname === "/settings";
  }
  return pathname.startsWith(href);
}

export function SettingsTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="設定分頁" className="border-b">
      <ul className="flex flex-wrap gap-2">
        {SETTINGS_TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
