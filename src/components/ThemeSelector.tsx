"use client";

import "@testing-library/jest-dom/vitest";
import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { listThemes } from "@/lib/pdf-themes/registry";
import { setTheme as persistTheme } from "@/lib/pdf-themes/persistence";
import { useSelectableTheme } from "@/lib/pdf-themes/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const themes = useMemo(() => listThemes(), []);
  const { themeId, setThemeId, didFallback, requestedId } = useSelectableTheme();
  const [isUpdating, setIsUpdating] = useState(false);
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

      <div className="flex flex-row gap-3 overflow-x-auto pb-1">
        {themes.map((theme) => {
          const isSelected = theme.id === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              data-testid={`theme-item-${theme.id}`}
              aria-selected={isSelected}
              disabled={isUpdating}
              onClick={() => void handleSelect(theme.id)}
              className={cn(
                "min-w-72 rounded-md border p-3 text-left transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "border-primary bg-primary/10",
              )}
            >
              <div className="mb-2 h-20 w-full rounded border border-border bg-muted/70" />
              <p className="text-sm font-semibold">
                {theme.displayName ?? theme.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {theme.description ?? "無描述"}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
