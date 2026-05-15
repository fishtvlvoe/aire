"use client";

import { useEffect, useState } from "react";
import { LogoUploader } from "@/components/LogoUploader";
import { TauriRequired } from "@/components/TauriRequired";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { isTauriEnv } from "@/lib/tauri-bridge";

export default function BrandingContent() {
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const detected = await isTauriEnv();
      if (!mounted) return;
      setIsTauri(detected);
      setIsLoadingEnv(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoadingEnv) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground" role="status">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        偵測桌面環境中…
      </div>
    );
  }

  if (!isTauri) {
    return <TauriRequired />;
  }

  return (
    <ThemeProvider initialThemeId="theme-a-minimal">
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold">品牌設定</h2>
          <p className="text-sm text-muted-foreground">
            上傳公司 Logo 並切換 PDF 主題風格。
          </p>
        </header>

        <LogoUploader />
        <ThemeSelector />
      </div>
    </ThemeProvider>
  );
}
