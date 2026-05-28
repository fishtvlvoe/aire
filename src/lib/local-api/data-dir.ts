/**
 * 跨平台本機資料目錄 adapter（server-only，禁止前端 client 元件 import）
 *
 * 職責：
 *   1. 決定本機資料根目錄（依 OS 慣例或環境變數覆蓋）
 *   2. 提供各子目錄的絕對路徑，並確保目錄存在（mkdir recursive）
 *   3. 提供原子寫檔 helper，取代 Rust export_pdf 的原子寫檔行為
 *
 * 資料目錄設計依據：
 *   openspec/changes/browser-local-runtime-mvp/design.md Decision 4
 *
 * 平台對應：
 *   Windows  → %LOCALAPPDATA%\AIRE\     （通常 C:\Users\<user>\AppData\Local\AIRE\）
 *   macOS    → ~/Library/Application Support/AIRE/
 *   Linux    → ~/.local/share/AIRE/
 *
 * 環境變數覆蓋：
 *   AIRE_DATA_DIR — 測試與本機驗收時用，指向 tmp 目錄
 *
 * ⚠️  此模組使用 Node.js `fs`、`os`、`path`，不可被 Next.js client bundle 引入。
 *     Next.js 的 RSC 邊界已在 server component 層隔離；若需更強的靜態分析保護，
 *     可在 package.json 加入 "server-only" 並在此加 `import "server-only"`。
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ──────────────────────────────────────────────────────────────────────────────
// 根目錄解析
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 取得本機資料根目錄。
 * 優先使用 `AIRE_DATA_DIR` 環境變數（測試/驗收用），
 * 否則依 OS 慣例決定路徑並確保目錄存在。
 *
 * @returns 本機資料根目錄的絕對路徑（已確保存在）
 */
export function getDataDir(): string {
  // 環境變數覆蓋（測試與本機驗收用）
  if (process.env.AIRE_DATA_DIR) {
    const override = path.resolve(process.env.AIRE_DATA_DIR);
    ensureDir(override);
    return override;
  }

  const platform = process.platform;
  let base: string;

  if (platform === "win32") {
    // Windows: %LOCALAPPDATA%\AIRE\
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    base = path.join(localAppData, "AIRE");
  } else if (platform === "darwin") {
    // macOS: ~/Library/Application Support/AIRE/
    base = path.join(os.homedir(), "Library", "Application Support", "AIRE");
  } else {
    // Linux（含其他 Unix）: ~/.local/share/AIRE/
    const xdgDataHome = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
    base = path.join(xdgDataHome, "AIRE");
  }

  ensureDir(base);
  return base;
}

// ──────────────────────────────────────────────────────────────────────────────
// 子目錄 helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 定義所有子目錄名稱（與 Decision 4 對應）。
 * 新增子目錄時在此處新增即可，helpers 會自動對應。
 */
export type DataSubDir = "db" | "credentials" | "uploads" | "pdf" | "logs";

/** 子目錄名稱對應（子目錄名 → 實際目錄名） */
const SUB_DIR_NAMES: Record<DataSubDir, string> = {
  db: "db",
  credentials: "credentials",
  uploads: "uploads",
  pdf: "pdf",
  logs: "logs",
};

/**
 * 取得指定子目錄的絕對路徑，並確保目錄已存在。
 *
 * @param sub - 子目錄識別碼
 * @returns 子目錄絕對路徑（已確保存在）
 *
 * @example
 *   const dbDir = getSubDir("db");       // .../AIRE/db/
 *   const pdfDir = getSubDir("pdf");     // .../AIRE/pdf/
 *   const credDir = getSubDir("credentials"); // .../AIRE/credentials/
 */
export function getSubDir(sub: DataSubDir): string {
  const dir = path.join(getDataDir(), SUB_DIR_NAMES[sub]);
  ensureDir(dir);
  return dir;
}

/**
 * 取得 db/ 子目錄路徑（已確保存在）。
 * 放 SQLite 資料庫檔案（cases.db 等）。
 */
export function getDbDir(): string {
  return getSubDir("db");
}

/**
 * 取得 credentials/ 子目錄路徑（已確保存在）。
 * 放加密後的 COP 帳密（Decision 7：禁止明碼）。
 */
export function getCredentialsDir(): string {
  return getSubDir("credentials");
}

/**
 * 取得 uploads/ 子目錄路徑（已確保存在）。
 * 放業務上傳的格局圖、照片等補件檔案。
 */
export function getUploadsDir(): string {
  return getSubDir("uploads");
}

/**
 * 取得 pdf/ 子目錄路徑（已確保存在）。
 * 放草稿書與說明書 PDF 產出（Decision 9：兩階段 PDF）。
 */
export function getPdfDir(): string {
  return getSubDir("pdf");
}

/**
 * 取得 logs/ 子目錄路徑（已確保存在）。
 * 放 runtime logs。
 */
export function getLogsDir(): string {
  return getSubDir("logs");
}

// ──────────────────────────────────────────────────────────────────────────────
// 原子寫檔（取代 Rust export_pdf 的 atomic write）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 原子寫檔：先寫到 `{targetPath}.tmp`，成功後 rename 到 `targetPath`。
 *
 * 取代 Rust `export_pdf` IPC 的原子寫檔行為（Decision 9）。
 * 確保目標路徑不會出現半寫入的損壞檔案：
 *   - 寫檔中途斷電 → 留下 .tmp，不污染目標路徑
 *   - rename 是 POSIX 原子操作（同一磁碟分割）
 *
 * @param targetPath - 最終輸出的絕對路徑（含檔名）
 * @param data       - 要寫入的內容（Buffer 或 Uint8Array）
 *
 * @throws 寫檔或 rename 失敗時，拋出 Node.js 原生 Error，並清除殘留的 .tmp
 *
 * @example
 *   const pdfPath = path.join(getPdfDir(), `draft-${caseId}.pdf`);
 *   await atomicWriteFile(pdfPath, pdfBuffer);
 */
export async function atomicWriteFile(
  targetPath: string,
  data: Buffer | Uint8Array,
): Promise<void> {
  const tmpPath = `${targetPath}.tmp`;

  try {
    // 確保目標目錄存在（呼叫端可能傳入尚未建立的子路徑）
    ensureDir(path.dirname(targetPath));

    // 寫到暫存檔
    await fs.promises.writeFile(tmpPath, data);

    // 原子 rename：POSIX 保證同磁碟分割內的 rename 為原子操作
    await fs.promises.rename(tmpPath, targetPath);
  } catch (err) {
    // 清除殘留的 .tmp，避免占用空間或混淆後續操作
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // 若 .tmp 根本不存在就忽略（寫檔前就失敗的情況）
    }
    throw err;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 內部工具函式
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 確保目錄存在（mkdir recursive，idempotent）。
 * 若目錄已存在則不做任何事。
 *
 * @param dirPath - 要確保存在的目錄路徑
 */
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
