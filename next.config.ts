import type { NextConfig } from "next";

// AIRE 是 Tauri 桌面 App，Next.js 採 static export 模式
// 設計依據：openspec/changes/aire-desktop-phase1/design.md D1
const nextConfig: NextConfig = {
  // 靜態匯出到 out/，Tauri 的 frontendDist 指向此目錄（dev 模式不套用，避免動態路由限制）
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  // static export 不支援動態圖片優化
  images: {
    unoptimized: true,
  },
  // 桌面 App 不需要 React Strict Mode 重複渲染干擾 IPC 行為
  reactStrictMode: true,
  // Tauri 不走 server，避免 trailingSlash 問題用預設 false
  trailingSlash: false,
};

export default nextConfig;
