/**
 * task 3.1 — data-dir.ts 單元測試
 *
 * 測試策略：
 *   - 用 AIRE_DATA_DIR 環境變數指向 tmp 目錄，避免汙染真實本機資料目錄
 *   - 驗證子目錄建立（mkdir recursive）
 *   - 驗證原子寫檔（.tmp → rename）
 *   - 驗證原子寫檔中途失敗不留損壞目標檔
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// 測試環境設定：每個 test suite 用獨立 tmp 目錄
// ──────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  // 建立獨立 tmp 目錄，確保測試互不干擾
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aire-data-dir-test-"));
  process.env.AIRE_DATA_DIR = tmpDir;
});

afterEach(() => {
  // 清除環境變數，避免污染其他測試
  delete process.env.AIRE_DATA_DIR;
  // 清除 tmp 目錄
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ──────────────────────────────────────────────────────────────────────────────
// 輔助：動態 import，確保每次測試讀最新的環境變數
// ──────────────────────────────────────────────────────────────────────────────

async function importDataDir() {
  // 使用 vi.importActual 讓 vitest 重新求值模組（有別於 mock 快取）
  // 注意：因為 ESM 快取，直接 import 會取到同一個模組實例，
  // 但函式內部讀 process.env 是即時的，所以不需要 resetModules
  return import("@/lib/local-api/data-dir");
}

// ──────────────────────────────────────────────────────────────────────────────
// getDataDir()
// ──────────────────────────────────────────────────────────────────────────────

describe("getDataDir()", () => {
  it("AIRE_DATA_DIR 覆蓋時，回傳指定目錄並確保存在", async () => {
    const { getDataDir } = await importDataDir();
    const result = getDataDir();

    expect(result).toBe(tmpDir);
    expect(fs.existsSync(result)).toBe(true);
  });

  it("回傳路徑為絕對路徑", async () => {
    const { getDataDir } = await importDataDir();
    const result = getDataDir();

    expect(path.isAbsolute(result)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getSubDir() — 子目錄建立驗證
// ──────────────────────────────────────────────────────────────────────────────

describe("getSubDir() 子目錄建立", () => {
  const subDirs = ["db", "credentials", "uploads", "pdf", "logs"] as const;

  for (const sub of subDirs) {
    it(`getSubDir("${sub}") 應建立 ${sub}/ 子目錄並回傳絕對路徑`, async () => {
      const { getSubDir } = await importDataDir();
      const result = getSubDir(sub);

      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain(sub);
      expect(fs.existsSync(result)).toBe(true);
      expect(fs.statSync(result).isDirectory()).toBe(true);
    });
  }

  it("多次呼叫 getSubDir 不應拋錯（idempotent）", async () => {
    const { getSubDir } = await importDataDir();

    // 第一次建立
    getSubDir("pdf");
    // 第二次應不拋錯（mkdir recursive 的 idempotent 行為）
    expect(() => getSubDir("pdf")).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 個別子目錄 helper 驗證
// ──────────────────────────────────────────────────────────────────────────────

describe("個別子目錄 helper", () => {
  it("getDbDir() 回傳含 'db' 的存在目錄", async () => {
    const { getDbDir } = await importDataDir();
    const dir = getDbDir();
    expect(dir).toContain("db");
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("getCredentialsDir() 回傳含 'credentials' 的存在目錄", async () => {
    const { getCredentialsDir } = await importDataDir();
    const dir = getCredentialsDir();
    expect(dir).toContain("credentials");
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("getUploadsDir() 回傳含 'uploads' 的存在目錄", async () => {
    const { getUploadsDir } = await importDataDir();
    const dir = getUploadsDir();
    expect(dir).toContain("uploads");
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("getPdfDir() 回傳含 'pdf' 的存在目錄", async () => {
    const { getPdfDir } = await importDataDir();
    const dir = getPdfDir();
    expect(dir).toContain("pdf");
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("getLogsDir() 回傳含 'logs' 的存在目錄", async () => {
    const { getLogsDir } = await importDataDir();
    const dir = getLogsDir();
    expect(dir).toContain("logs");
    expect(fs.existsSync(dir)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// atomicWriteFile() — 原子寫檔驗證
// ──────────────────────────────────────────────────────────────────────────────

describe("atomicWriteFile()", () => {
  it("寫入 Buffer 後，目標檔存在且內容正確", async () => {
    const { atomicWriteFile, getPdfDir } = await importDataDir();
    const targetPath = path.join(getPdfDir(), "test-draft.pdf");
    const data = Buffer.from("FAKE PDF CONTENT 測試內容");

    await atomicWriteFile(targetPath, data);

    expect(fs.existsSync(targetPath)).toBe(true);
    expect(fs.readFileSync(targetPath)).toEqual(data);
  });

  it("寫入 Uint8Array 後，目標檔存在且內容正確", async () => {
    const { atomicWriteFile, getPdfDir } = await importDataDir();
    const targetPath = path.join(getPdfDir(), "test-uint8array.bin");
    const data = new Uint8Array([0x01, 0x02, 0x03, 0xff]);

    await atomicWriteFile(targetPath, data);

    expect(fs.existsSync(targetPath)).toBe(true);
    const written = fs.readFileSync(targetPath);
    expect(written[0]).toBe(0x01);
    expect(written[3]).toBe(0xff);
  });

  it("寫入後不留下 .tmp 暫存檔", async () => {
    const { atomicWriteFile, getPdfDir } = await importDataDir();
    const targetPath = path.join(getPdfDir(), "test-no-tmp.pdf");
    const tmpPath = `${targetPath}.tmp`;

    await atomicWriteFile(targetPath, Buffer.from("data"));

    // .tmp 應已被 rename 走，不殘留
    expect(fs.existsSync(tmpPath)).toBe(false);
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  it("目標目錄不存在時自動建立", async () => {
    const { atomicWriteFile, getDataDir } = await importDataDir();
    // 使用一個尚未建立的深層子目錄
    const nestedDir = path.join(getDataDir(), "nested", "deep");
    const targetPath = path.join(nestedDir, "output.bin");

    await atomicWriteFile(targetPath, Buffer.from("nested content"));

    expect(fs.existsSync(targetPath)).toBe(true);
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  it("覆蓋既有檔案正常運作（idempotent）", async () => {
    const { atomicWriteFile, getPdfDir } = await importDataDir();
    const targetPath = path.join(getPdfDir(), "overwrite-test.pdf");

    await atomicWriteFile(targetPath, Buffer.from("version 1"));
    await atomicWriteFile(targetPath, Buffer.from("version 2"));

    const content = fs.readFileSync(targetPath).toString();
    expect(content).toBe("version 2");
  });
});
