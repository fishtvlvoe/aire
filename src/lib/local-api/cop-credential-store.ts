/**
 * Node COP credential storage — AES-256-GCM 加密 JSON
 *
 * 設計依據：design.md Decision 7（禁止明碼）
 *
 * 加密方案：
 *   - 對稱加密：Node 內建 `crypto`，AES-256-GCM
 *   - 金鑰：首次執行時由本機熵（crypto.randomBytes）生成，
 *     存於 getCredentialsDir()/enc.key（檔案權限 0600）
 *   - 密文：存於 getCredentialsDir()/cop-credential.enc
 *     格式：JSON { iv, authTag, ciphertext }（皆 hex 字串）
 *
 * Windows DPAPI 整合：TODO — Wave 4 或 installer 整合時補齊
 *   當 process.platform === 'win32' 時，可改用 dpapi-ng / keytar 包裝 DPAPI，
 *   目前 MVP 在 Windows 也走 AES-256-GCM（金鑰檔同樣 0600，適合個人機器）。
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ReadCopCredentialResponse } from "./contract";
import { getCredentialsDir } from "./data-dir";

// ──────────────────────────────────────────────────────────────────────────────
// 常數
// ──────────────────────────────────────────────────────────────────────────────

/** 加密演算法 */
const ALGORITHM = "aes-256-gcm" as const;
/** AES-256 金鑰長度（bytes） */
const KEY_BYTES = 32;
/** GCM IV 長度（bytes，NIST 建議 96-bit） */
const IV_BYTES = 12;
/** 金鑰檔名稱 */
const KEY_FILE = "enc.key";
/** 密文檔名稱 */
const ENC_FILE = "cop-credential.enc";

// ──────────────────────────────────────────────────────────────────────────────
// 內部型別
// ──────────────────────────────────────────────────────────────────────────────

/** 儲存在磁碟的完整欄位（加密前的明文物件） */
interface StoredCredential {
  clientId: string;
  secret: string;
  savedAt: string;
}

/** cop-credential.enc 的磁碟格式 */
interface EncryptedBlob {
  iv: string;
  authTag: string;
  ciphertext: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 記憶體快取（模擬 singleton store；reloadStore() 清掉快取以模擬重啟）
// ──────────────────────────────────────────────────────────────────────────────

let _cache: StoredCredential | null | undefined = undefined; // undefined = 尚未讀過

function readEnvCredential(): StoredCredential | null {
  const clientId = process.env.LAND_REGISTRY_CLIENT_ID?.trim();
  const secret = process.env.LAND_REGISTRY_CLIENT_SECRET?.trim();
  if (!clientId || !secret) return null;
  return {
    clientId,
    secret,
    savedAt: "env",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 遮罩工具（對齊 Rust mask_keep_last4 邏輯）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 遮罩字串，保留末 4 碼可見，其餘以 * 取代（至少 4 個 *）。
 * 與 Rust api_key_storage.rs 的 mask_keep_last4 行為一致。
 */
function maskKeepLast4(input: string): string {
  if (!input) return "";
  const len = input.length;
  const keep = Math.min(len, 4);
  const maskedLen = Math.max(len - keep, 4);
  return "*".repeat(maskedLen) + input.slice(len - keep);
}

// ──────────────────────────────────────────────────────────────────────────────
// 金鑰管理
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 取得（或生成）加密金鑰。
 * 首次呼叫時生成 32 bytes 隨機金鑰並寫入 credentials/enc.key（0600）。
 * 後續呼叫直接讀取該檔案。
 */
function getOrCreateEncKey(): Buffer {
  const keyPath = path.join(getCredentialsDir(), KEY_FILE);

  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }

  // 首次：用本機熵生成金鑰
  const key = crypto.randomBytes(KEY_BYTES);
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  return key;
}

// ──────────────────────────────────────────────────────────────────────────────
// 加解密
// ──────────────────────────────────────────────────────────────────────────────

/** 加密明文 JSON 物件，回傳 EncryptedBlob */
function encrypt(data: StoredCredential, key: Buffer): EncryptedBlob {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
  };
}

/** 解密 EncryptedBlob，回傳原始物件 */
function decrypt(blob: EncryptedBlob, key: Buffer): StoredCredential {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(blob.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(blob.authTag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as StoredCredential;
}

// ──────────────────────────────────────────────────────────────────────────────
// 磁碟 I/O
// ──────────────────────────────────────────────────────────────────────────────

function encFilePath(): string {
  return path.join(getCredentialsDir(), ENC_FILE);
}

/** 從磁碟讀取並解密，回傳 null 若尚未存過 */
function loadFromDisk(): StoredCredential | null {
  const filePath = encFilePath();
  if (!fs.existsSync(filePath)) return null;
  const key = getOrCreateEncKey();
  const blob: EncryptedBlob = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return decrypt(blob, key);
}

/** 加密後寫入磁碟（檔案權限 0600） */
function saveToDisk(data: StoredCredential): void {
  const key = getOrCreateEncKey();
  const blob = encrypt(data, key);
  fs.writeFileSync(encFilePath(), JSON.stringify(blob), { mode: 0o600 });
}

// ──────────────────────────────────────────────────────────────────────────────
// 公開 API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 加密並儲存 COP 帳密。
 * 禁止明碼儲存（Decision 7）。
 *
 * @param clientId - COP Client ID
 * @param secret   - COP Client Secret（明碼，加密後不再可讀）
 */
export async function saveCopCredential(clientId: string, secret: string): Promise<void> {
  const data: StoredCredential = {
    clientId,
    secret,
    savedAt: new Date().toISOString(),
  };
  saveToDisk(data);
  _cache = data; // 更新記憶體快取
}

/**
 * 讀取 COP 帳密（遮罩回傳，不吐明碼 secret）。
 * 回傳 null 表示尚未設定帳密。
 */
export async function readCopCredential(): Promise<ReadCopCredentialResponse | null> {
  const envCredential = readEnvCredential();
  if (envCredential) {
    return {
      clientIdMasked: maskKeepLast4(envCredential.clientId),
      hasSecret: Boolean(envCredential.secret),
      savedAt: envCredential.savedAt,
    };
  }

  // 記憶體快取未初始化時，從磁碟讀取
  if (_cache === undefined) {
    _cache = loadFromDisk();
  }

  if (_cache === null) return null;

  return {
    clientIdMasked: maskKeepLast4(_cache.clientId),
    hasSecret: Boolean(_cache.secret),
    savedAt: _cache.savedAt,
  };
}

export async function readRawCopCredential(): Promise<{ clientId: string; secret: string } | null> {
  const envCredential = readEnvCredential();
  if (envCredential) {
    return {
      clientId: envCredential.clientId,
      secret: envCredential.secret,
    };
  }

  if (_cache === undefined) {
    _cache = loadFromDisk();
  }

  if (_cache === null) return null;
  return {
    clientId: _cache.clientId,
    secret: _cache.secret,
  };
}

/**
 * 模擬重啟：清除記憶體快取，保留磁碟上的加密檔案。
 * 下次 readCopCredential() 會重新從磁碟讀取（模擬冷啟動行為）。
 */
export async function reloadStore(): Promise<void> {
  _cache = undefined; // 重設為「尚未讀過」，下次讀時觸發磁碟 I/O
}
