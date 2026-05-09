import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import {
  clearOpenAIApiKey,
  decryptApiKey,
  encryptApiKey,
  getOpenAIApiKey,
  setOpenAIApiKey,
} from '../key-store';

describe('key-store', () => {
  beforeEach(() => {
    db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    db.prepare('DELETE FROM settings WHERE key = ?').run('openai_api_key');
  });

  it('encrypt/decrypt roundtrip works with same machine identity', () => {
    const encrypted = encryptApiKey('sk-proj-valid123', {
      hostname: 'fish-macbook',
      username: 'fish',
      salt: 'AIRE-v1',
    });

    const decrypted = decryptApiKey(encrypted, {
      hostname: 'fish-macbook',
      username: 'fish',
      salt: 'AIRE-v1',
    });

    expect(decrypted).toBe('sk-proj-valid123');
  });

  it('returns null and clears ciphertext when decrypting on different machine', () => {
    setOpenAIApiKey('sk-proj-valid123', {
      hostname: 'fish-macbook',
      username: 'fish',
      salt: 'AIRE-v1',
    });

    const value = getOpenAIApiKey({
      hostname: 'office-macbook',
      username: 'fish',
      salt: 'AIRE-v1',
    });

    expect(value).toBeNull();
    const row = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('openai_api_key') as { value?: string } | undefined;
    expect(row).toBeUndefined();
  });

  it('returns null when key does not exist', () => {
    clearOpenAIApiKey();
    expect(getOpenAIApiKey()).toBeNull();
  });
});

