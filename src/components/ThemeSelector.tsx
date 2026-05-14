"use client";

import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listThemes } from "@/lib/pdf-themes/registry";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const themes = useMemo(() => listThemes(), []);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    themes[0]?.id ?? "",
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(themeId: string) {
    if (!themeId || isUpdating || themeId === selectedThemeId) return;
    setIsUpdating(true);
    setError(null);
    try {
      await invoke("set_theme", { theme_id: themeId });
      setSelectedThemeId(themeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "主題切換失敗，請稍後再試");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">主題</h3>

      <div className="flex flex-row gap-3 overflow-x-auto pb-1">
        {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
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
