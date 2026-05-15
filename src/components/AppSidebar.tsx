"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Palette, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "案件管理", href: "/cases", icon: FileText },
  { label: "品牌設定", href: "/settings/branding", icon: Palette },
  { label: "日誌", href: "/settings/logs", icon: ScrollText },
];

export function AppSidebar() {
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
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 底部 App 資訊 */}
      <div className="border-t px-4 py-3">
        <p className="text-sm font-semibold text-foreground">AIRE</p>
        <p className="text-xs text-muted-foreground">v0.1.0</p>
      </div>
    </div>
  );
}
