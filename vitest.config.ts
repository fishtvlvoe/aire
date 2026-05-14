import { defineConfig } from "vitest/config";
import path from "node:path";

// AIRE 單元測試配置
// 使用 jsdom 環境模擬 DOM,React Testing Library 渲染元件
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "docs/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "out/**", "src-tauri/**", "legacy/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
