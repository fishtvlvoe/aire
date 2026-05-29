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

/**
 * Session token 動態載入
 *
 * 改為 client-side 的 App Initialization 讀取 /api/config。
 * 移除 build time 注入邏輯（process.env 在 build time 被捕獲，launcher 運行時設定無效）。
 */

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        {/* 佔位符：會由 client 端初始化腳本覆蓋 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__AIRE_LOCAL_TOKEN__ = "";`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
