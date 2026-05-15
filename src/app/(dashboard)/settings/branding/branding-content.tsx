"use client";

import { LogoUploader } from "@/components/LogoUploader";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";

export default function BrandingContent() {
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
