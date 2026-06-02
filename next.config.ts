import type { NextConfig } from "next";

// AIRE 本機 runtime 模式：Next.js standalone server 在使用者本機 127.0.0.1 執行
// 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 6
const nextConfig: NextConfig = {
  // standalone 模式：產出 .next/standalone/server.js，供本機 Node runtime 啟動
  // （舊模式為 static export 給 Tauri frontendDist，已 park — 見 src-tauri/PARKED.md）
  output: "standalone",
  // standalone 模式同樣需要關閉動態圖片優化（本機 server 無 CDN 圖片優化服務）
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  trailingSlash: false,
  // Playwright local-web E2E runs on 127.0.0.1; allow dev assets to load from this origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
