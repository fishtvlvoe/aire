import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/public.db';

// Ensure DB folder exists (supports both relative and absolute DATABASE_PATH).
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let v = bytes;
  let idx = 0;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  const decimals = idx === 0 ? 0 : 1;
  return `${v.toFixed(decimals)} ${units[idx]}`;
}

export function getDbSize(): string {
  try {
    const stat = fs.statSync(dbPath);
    return formatBytes(stat.size);
  } catch {
    return '0 B';
  }
}
