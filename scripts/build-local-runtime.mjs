#!/usr/bin/env node
/**
 * build-local-runtime.mjs — AIRE 本機 runtime 打包腳本
 *
 * 執行後產出 dist-local-runtime/，結構：
 *   dist-local-runtime/
 *     server.js          ← Next.js standalone 入口
 *     package.json       ← standalone package.json（{"type":"commonjs"}）
 *     node_modules/      ← standalone trace 的 node_modules
 *     .next/
 *       server/          ← server bundle
 *       static/          ← 靜態資產（從 .next/static 複製）
 *       BUILD_ID 等      ← standalone 內已有，不重複複製
 *     public/            ← 公開靜態檔
 *
 * 關於 better-sqlite3 native binding：
 *   Next.js standalone trace 已包含 .node binding（自動追蹤 require）。
 *   本腳本額外驗證 binding 存在；若缺漏則從 node_modules/.pnpm 手動複製。
 *
 * 使用方式：
 *   pnpm build:local-runtime
 *   （或直接 node scripts/build-local-runtime.mjs）
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 路徑常數 ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STANDALONE = path.join(ROOT, ".next", "standalone");
const STATIC_SRC = path.join(ROOT, ".next", "static");
const PUBLIC_SRC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist-local-runtime");

// ── 工具函式 ──────────────────────────────────────────────────────────────────

/** 遞迴複製目錄（cp -r 語意，目標不存在時建立） */
function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      cpDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      // 保留 symlink（standalone node_modules 大量使用 symlink）
      try {
        fs.unlinkSync(destPath);
      } catch {
        // 目標不存在，忽略
      }
      const linkTarget = fs.readlinkSync(srcPath);
      fs.symlinkSync(linkTarget, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** 在指定目錄樹中尋找 *.node 檔案（含 symlink 解析後的真實路徑） */
function findNodeBindings(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findNodeBindings(fullPath));
    } else if (entry.isSymbolicLink()) {
      // 只解析一層，避免無窮迴圈
      try {
        const resolved = fs.realpathSync(fullPath);
        if (resolved.endsWith(".node")) result.push(resolved);
      } catch {
        // dangling symlink，忽略
      }
    } else if (entry.name.endsWith(".node")) {
      result.push(fullPath);
    }
  }
  return result;
}

// ── Step 1：pnpm build ────────────────────────────────────────────────────────
console.log("▶ Step 1/5  pnpm build");
execSync("pnpm build", { cwd: ROOT, stdio: "inherit" });

// ── Step 2：清理舊 dist ───────────────────────────────────────────────────────
console.log("▶ Step 2/5  清理 dist-local-runtime/");
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ── Step 3：複製 standalone/* ─────────────────────────────────────────────────
console.log("▶ Step 3/5  複製 .next/standalone → dist-local-runtime/");
if (!fs.existsSync(STANDALONE)) {
  console.error("✗ .next/standalone 不存在，請確認 next.config.ts output:'standalone'");
  process.exit(1);
}
cpDir(STANDALONE, DIST);

// ── Step 4：複製 .next/static 與 public ──────────────────────────────────────
console.log("▶ Step 4/5  複製 .next/static + public");

// .next/static → dist-local-runtime/.next/static
const staticDest = path.join(DIST, ".next", "static");
if (fs.existsSync(STATIC_SRC)) {
  cpDir(STATIC_SRC, staticDest);
  console.log("  .next/static ✓");
} else {
  console.warn("  ⚠ .next/static 不存在，跳過");
}

// public → dist-local-runtime/public
if (fs.existsSync(PUBLIC_SRC)) {
  cpDir(PUBLIC_SRC, path.join(DIST, "public"));
  console.log("  public ✓");
} else {
  console.warn("  ⚠ public 不存在，跳過");
}

// ── Step 5：驗證 better-sqlite3 native binding ───────────────────────────────
console.log("▶ Step 5/5  驗證 better-sqlite3 native binding");

const distNodeModules = path.join(DIST, "node_modules");
const bindingsInDist = findNodeBindings(distNodeModules).filter((p) =>
  p.includes("better-sqlite3"),
);

if (bindingsInDist.length > 0) {
  console.log("  better-sqlite3 binding 已在 standalone trace 內：");
  bindingsInDist.forEach((p) =>
    console.log("    " + path.relative(DIST, p))
  );
} else {
  // Standalone trace 未包含 binding → 手動從 pnpm store 複製
  console.warn("  ⚠ standalone trace 未含 better-sqlite3 binding，手動補入");

  // 在 node_modules/.pnpm 中找 better-sqlite3 Release 目錄
  const pnpmBetterSqlite = path.join(
    ROOT,
    "node_modules",
    ".pnpm",
    "better-sqlite3@12.10.0",
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
  );

  if (!fs.existsSync(pnpmBetterSqlite)) {
    console.error(
      "✗ 找不到 better-sqlite3 Release 目錄：" + pnpmBetterSqlite
    );
    process.exit(1);
  }

  // 目標路徑：對齊 standalone 慣例
  const destRelease = path.join(
    distNodeModules,
    ".pnpm",
    "better-sqlite3@12.10.0",
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
  );
  fs.mkdirSync(destRelease, { recursive: true });

  for (const file of fs.readdirSync(pnpmBetterSqlite)) {
    if (file.endsWith(".node")) {
      fs.copyFileSync(
        path.join(pnpmBetterSqlite, file),
        path.join(destRelease, file),
      );
      console.log("  複製 " + file + " → dist-local-runtime/" + path.relative(DIST, path.join(destRelease, file)));
    }
  }
}

// ── 完成摘要 ──────────────────────────────────────────────────────────────────
console.log("\n✓ dist-local-runtime 組裝完成");
console.log("  server.js     :", fs.existsSync(path.join(DIST, "server.js")) ? "存在" : "缺漏 ✗");
console.log("  .next/static  :", fs.existsSync(path.join(DIST, ".next", "static")) ? "存在" : "缺漏 ✗");
console.log("  public/       :", fs.existsSync(path.join(DIST, "public")) ? "存在" : "缺漏 ✗");
console.log("\n啟動方式：");
console.log("  AIRE_LOCAL_TOKEN=<token> AIRE_DATA_DIR=/tmp/aire HOSTNAME=127.0.0.1 PORT=3000 node dist-local-runtime/server.js");
