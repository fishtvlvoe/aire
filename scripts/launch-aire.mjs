#!/usr/bin/env node
/**
 * launch-aire.mjs — AIRE 本機 runtime 跨平台 launcher
 *
 * 職責：
 *   1. 找可用 port（從 3000 起探測，避免衝突）
 *   2. 生成隨機 session token（64 hex chars）
 *   3. 設定環境變數（AIRE_LOCAL_TOKEN / AIRE_DATA_DIR / HOSTNAME / PORT）
 *   4. spawn node dist-local-runtime/server.js
 *   5. polling /api/health 直到 200（最多 30 秒）
 *   6. 開系統預設瀏覽器（macOS: open、Windows: start、Linux: xdg-open）
 *   7. 重複啟動偵測：port 已被佔用時嘗試復用既有 runtime
 *
 * 設計依據：
 *   openspec/changes/browser-local-runtime-mvp/design.md
 *   Decision 2（127.0.0.1 only）、Decision 3（session token）、Decision 4（資料目錄）
 *
 * 使用方式：
 *   node scripts/launch-aire.mjs
 *   （或透過 launch-aire.cmd / launch-aire.ps1 包裝呼叫）
 */

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 常數 ──────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SERVER_JS = path.join(ROOT, "dist-local-runtime", "server.js");

/** 起始 port，往上探測 */
const PORT_START = 3000;
/** 最多嘗試幾個 port */
const PORT_MAX_TRY = 20;
/** polling /api/health 逾時（毫秒） */
const HEALTH_TIMEOUT_MS = 30_000;
/** polling 間隔（毫秒） */
const HEALTH_POLL_INTERVAL_MS = 300;
/** 只綁 127.0.0.1，不可 0.0.0.0（Decision 2） */
const BIND_HOST = "127.0.0.1";

// ── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 偵測某 port 是否已被佔用。
 * @param {number} port
 * @returns {Promise<boolean>} true = 已佔用
 */
function isPortOccupied(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, BIND_HOST);
  });
}

/**
 * 從 PORT_START 往上找第一個可用 port。
 * @returns {Promise<number>}
 */
async function findAvailablePort() {
  for (let port = PORT_START; port < PORT_START + PORT_MAX_TRY; port++) {
    const occupied = await isPortOccupied(port);
    if (!occupied) return port;
  }
  throw new Error(
    `找不到可用 port（嘗試了 ${PORT_START}–${PORT_START + PORT_MAX_TRY - 1}）`
  );
}

/**
 * 生成 64 hex chars 的隨機 session token。
 * @returns {string}
 */
function generateToken() {
  return randomBytes(32).toString("hex");
}

/**
 * 決定平台資料目錄（可被 AIRE_DATA_DIR env 覆蓋）。
 * @returns {string}
 */
function resolveDataDir() {
  if (process.env.AIRE_DATA_DIR) {
    return path.resolve(process.env.AIRE_DATA_DIR);
  }
  const platform = process.platform;
  if (platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(local, "AIRE");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "AIRE");
  } else {
    const xdg = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
    return path.join(xdg, "AIRE");
  }
}

/**
 * 向 /api/health polling，直到回 200 或逾時。
 * @param {number} port
 * @returns {Promise<void>}
 */
function waitForHealth(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + HEALTH_TIMEOUT_MS;

    function poll() {
      if (Date.now() > deadline) {
        reject(new Error(`/api/health polling 逾時（${HEALTH_TIMEOUT_MS}ms）`));
        return;
      }
      const req = http.get(
        { hostname: BIND_HOST, port, path: "/api/health", timeout: 2000 },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
          }
          // 消費 response body，避免 keep-alive hang
          res.resume();
        }
      );
      req.on("error", () => setTimeout(poll, HEALTH_POLL_INTERVAL_MS));
      req.on("timeout", () => {
        req.destroy();
        setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
      });
    }

    poll();
  });
}

/**
 * 嘗試打 /api/health 確認既有 runtime 健康（用於重複啟動偵測）。
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function checkExistingHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: BIND_HOST, port, path: "/api/health", timeout: 2000 },
      (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 以系統預設瀏覽器開啟 URL。
 * @param {string} url
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === "darwin") {
    cmd = "open";
  } else if (platform === "win32") {
    cmd = "start";
  } else {
    cmd = "xdg-open";
  }

  const child = spawn(cmd, [url], {
    detached: true,
    stdio: "ignore",
    shell: platform === "win32", // Windows start 需要 shell
  });
  child.unref();
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  // 確認 server.js 存在
  if (!fs.existsSync(SERVER_JS)) {
    console.error(
      "✗ dist-local-runtime/server.js 不存在，請先執行：pnpm build:local-runtime"
    );
    process.exit(1);
  }

  // 偵測重複啟動：PORT_START 是否已被自己的 runtime 佔用
  const defaultPortOccupied = await isPortOccupied(PORT_START);
  if (defaultPortOccupied) {
    const healthy = await checkExistingHealth(PORT_START);
    if (healthy) {
      const url = `http://${BIND_HOST}:${PORT_START}`;
      console.log(`✓ AIRE runtime 已在執行（port ${PORT_START}），直接開啟瀏覽器`);
      console.log("  URL:", url);
      openBrowser(url);
      return;
    }
    // port 被佔但不健康（其他程式）→ 往上找可用 port
    console.warn(`⚠ port ${PORT_START} 被佔用且非 AIRE runtime，往上尋找可用 port`);
  }

  const port = await findAvailablePort();
  const token = generateToken();
  const dataDir = resolveDataDir();
  const url = `http://${BIND_HOST}:${port}`;

  console.log("▶ AIRE Launcher");
  console.log("  port     :", port);
  console.log("  data dir :", dataDir);
  console.log("  URL      :", url);

  // 確保資料目錄存在
  fs.mkdirSync(dataDir, { recursive: true });

  // spawn server（繼承 stdout/stderr 讓使用者看到 log）
  const serverEnv = {
    ...process.env,
    AIRE_LOCAL_TOKEN: token,
    AIRE_DATA_DIR: dataDir,
    HOSTNAME: BIND_HOST,
    PORT: String(port),
    NODE_ENV: "production",
  };

  // 使用 next dev（開發 server，綁定 127.0.0.1 本機安全）
  // 本機 runtime 無需優化，dev server 足夠
  const serverProcess = spawn("pnpm", ["dev"], {
    env: serverEnv,
    stdio: "inherit",
    cwd: ROOT,
  });

  serverProcess.on("error", (err) => {
    console.error("✗ server 啟動失敗：", err.message);
    process.exit(1);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`✗ server 意外結束（exit code ${code}）`);
    }
  });

  // 轉發終止訊號，確保 server 子程序也被清除
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      serverProcess.kill(sig);
      process.exit(0);
    });
  }

  // polling /api/health
  console.log("▶ 等待 server 就緒...");
  try {
    await waitForHealth(port);
  } catch (err) {
    console.error("✗", err.message);
    serverProcess.kill("SIGTERM");
    process.exit(1);
  }

  console.log("✓ AIRE runtime 就緒，開啟瀏覽器...");
  openBrowser(url);
}

main().catch((err) => {
  console.error("✗ launcher 意外錯誤：", err);
  process.exit(1);
});
