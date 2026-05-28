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
 * 從環境變數讀取 session token（launcher 啟動時設定 AIRE_LOCAL_TOKEN）。
 * Server Component 安全注入：env 只在 server 端可見，不洩漏給前端 bundle。
 * 前端透過 window.__AIRE_LOCAL_TOKEN__ 讀取，放入每次 /api/local/* 請求 header。
 */
function getLocalTokenForInjection(): string {
  return process.env.AIRE_LOCAL_TOKEN ?? "";
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const token = getLocalTokenForInjection();

  return (
    <html lang="zh-Hant">
      <head>
        {/* 注入 session token — launcher 啟動時設 AIRE_LOCAL_TOKEN 環境變數
            dangerouslySetInnerHTML 注入純 hex 字串，token 不含使用者輸入，無 XSS 風險 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__AIRE_LOCAL_TOKEN__ = ${JSON.stringify(token)};`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
