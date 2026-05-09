import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import os from 'node:os';
import { writeAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';

const SETTINGS_KEY = 'openai_api_key';
const DEFAULT_APP_SALT = 'AIRE-v1';
const SCRYPT_SALT = 'AIRE-aes';

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

export interface MachineIdentity {
  hostname: string;
  username: string;
  salt: string;
}

function resolveMachineIdentity(
  override: Partial<MachineIdentity> = {},
): MachineIdentity {
  return {
    hostname: override.hostname ?? os.hostname(),
    username: override.username ?? os.userInfo().username,
    salt: override.salt ?? DEFAULT_APP_SALT,
  };
}

function ensureSettingsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export function deriveEncryptionKey(
  identity: Partial<MachineIdentity> = {},
): Buffer {
  const machine = resolveMachineIdentity(identity);
  const input = `${machine.hostname}:${machine.username}:${machine.salt}`;
  return scryptSync(input, SCRYPT_SALT, 32);
}

export function encryptApiKey(
  plainApiKey: string,
  identity: Partial<MachineIdentity> = {},
): string {
  const iv = randomBytes(12);
  const key = deriveEncryptionKey(identity);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainApiKey, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
  return JSON.stringify(payload);
}

export function decryptApiKey(
  encryptedPayload: string,
  identity: Partial<MachineIdentity> = {},
): string {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(encryptedPayload) as EncryptedPayload;
  } catch {
    throw new Error('invalid-encrypted-payload');
  }

  if (!payload.iv || !payload.tag || !payload.data) {
    throw new Error('invalid-encrypted-payload');
  }

  const key = deriveEncryptionKey(identity);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(payload.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function setOpenAIApiKey(
  apiKey: string,
  identity: Partial<MachineIdentity> = {},
): void {
  ensureSettingsTable();
  const encrypted = encryptApiKey(apiKey, identity);
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `).run(SETTINGS_KEY, encrypted);
  writeAuditLog(null, 'openai_api_key_set', 'settings', null, 'Encrypted key saved');
}

export function clearOpenAIApiKey(): void {
  ensureSettingsTable();
  db.prepare('DELETE FROM settings WHERE key = ?').run(SETTINGS_KEY);
  writeAuditLog(null, 'openai_api_key_cleared', 'settings', null, 'Key entry removed');
}

export function getOpenAIApiKey(
  identity: Partial<MachineIdentity> = {},
): string | null {
  ensureSettingsTable();
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ? LIMIT 1')
    .get(SETTINGS_KEY) as { value: string } | undefined;

  if (!row?.value) {
    return null;
  }

  try {
    return decryptApiKey(row.value, identity);
  } catch {
    db.prepare('DELETE FROM settings WHERE key = ?').run(SETTINGS_KEY);
    writeAuditLog(
      null,
      'openai_api_key_corrupted',
      'settings',
      null,
      'Decryption failed, entry removed',
    );
    return null;
  }
}

