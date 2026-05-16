"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { listThemes } from "@/lib/pdf-themes/registry";
import { setTheme as persistTheme } from "@/lib/pdf-themes/persistence";
import { useSelectableTheme } from "@/lib/pdf-themes/theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const THEME_PRESETS: Record<string, { primary: string; secondary: string; background: string }> = {
  "theme-a-minimal": {
    primary: "#2D5A8E",
    secondary: "#4A7EB5",
    background: "#F5F7FA",
  },
  "theme-b-professional": {
    primary: "#2C3E50",
    secondary: "#4B5563",
    background: "#F3F4F6",
  },
  "theme-c-tech-elegant": {
    primary: "#1A1A2E",
    secondary: "#16213E",
    background: "#0F3460",
  },
  "theme-d-fresh": {
    primary: "#27AE60",
    secondary: "#2D8A4E",
    background: "#EAF7EF",
  },
  "theme-e-warm": {
    primary: "#E67E22",
    secondary: "#B86A23",
    background: "#FFF3E8",
  },
};

export function ThemeSelector() {
  const themes = useMemo(() => listThemes(), []);
  const { themeId, setThemeId, didFallback, requestedId } = useSelectableTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(nextThemeId: string) {
    if (!nextThemeId || isUpdating || nextThemeId === themeId) return;
    setIsUpdating(true);
    setError(null);
    try {
      const result = await persistTheme(nextThemeId);
      if (result?.success) {
        setThemeId(result.themeId ?? nextThemeId);
      } else {
        setError(result?.error ?? "主題切換失敗，請稍後再試");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "主題切換失敗，請稍後再試");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="space-y-3 font-sans">
      <h3 className="inline-flex items-center gap-2 text-base font-semibold">
        <Palette className="h-4 w-4" />
        主題
      </h3>

      {didFallback && (
        <div
          role="status"
          data-testid="theme-fallback-banner"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          找不到主題「{requestedId}」，已自動回退至「淡雅 Minimal」。
        </div>
      )}

      <div role="listbox" aria-label="主題選擇" className="flex flex-row gap-3 overflow-x-auto pb-1">
        {themes.map((theme) => {
          const isSelected = theme.id === themeId;
          return (
            <div
              key={theme.id}
              role="option"
              data-testid={`theme-item-${theme.id}`}
              aria-selected={isSelected}
              tabIndex={0}
              onClick={() => !isUpdating && void handleSelect(theme.id)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isUpdating) {
                  e.preventDefault();
                  void handleSelect(theme.id);
                }
              }}
              className={cn(
                "min-w-72 cursor-pointer rounded-md border p-3 text-left transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isUpdating && "cursor-not-allowed opacity-50",
                isSelected && "border-primary bg-primary/10",
              )}
            >
              <div className="mb-2 flex gap-2">
                {(["primary", "secondary", "background"] as const).map((tone) => (
                  <span
                    key={tone}
                    className="h-5 w-1/3 rounded border border-border"
                    style={{
                      backgroundColor:
                        THEME_PRESETS[theme.id]?.[tone] ??
                        THEME_PRESETS["theme-a-minimal"][tone],
                    }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold">
                {theme.displayName ?? theme.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {theme.description ?? "無描述"}
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewThemeId(theme.id);
                  }}
                >
                  預覽
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={previewThemeId !== null} onOpenChange={(open) => !open && setPreviewThemeId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>不動產說明書（預覽）</DialogTitle>
            <DialogDescription>主題預覽僅示意配色與版面，不含真實案件資料。</DialogDescription>
          </DialogHeader>
          <div
            className="rounded border p-4"
            style={{
              backgroundColor:
                THEME_PRESETS[previewThemeId ?? "theme-a-minimal"]?.background ??
                "#F5F7FA",
              color: THEME_PRESETS[previewThemeId ?? "theme-a-minimal"]?.primary ?? "#2D5A8E",
            }}
          >
            <h3 className="text-lg font-semibold">不動產說明書</h3>
            <p className="text-sm">物件地址：台北市信義區市府路1號</p>
            <p className="text-sm">物件類型：住宅</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded border bg-white/70 p-3">基本資訊</div>
              <div className="rounded border bg-white/70 p-3">交易資訊</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
