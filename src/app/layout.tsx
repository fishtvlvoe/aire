import type { Metadata } from "next";
import type { ReactNode } from "react";

// 自架字型（離線可用，符合桌面 App 不依賴外網的原則）
import "@fontsource/noto-sans-tc/400.css";
import "@fontsource/noto-sans-tc/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";

// 設計 tokens 與 Tailwind v4 入口
import "../styles/globals.css";

// Root layout — Tauri WebView 載入的第一層
export const metadata: Metadata = {
  title: "AIRE",
  description: "不動產說明書桌面 App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
