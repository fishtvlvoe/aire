import type { Metadata } from "next";
import type { ReactNode } from "react";

// Root layout — Tauri WebView 載入的第一層
// 字型、設計 token 注入留到 Group 10 處理，這裡只給最小骨架
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
