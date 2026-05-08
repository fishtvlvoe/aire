import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db } from '@/lib/db';

// 5 種文件類型的預設定義
// key 對應 feature_flags 表的 key 欄位，label 用於前端顯示
export const DOC_FLAG_DEFS = [
  { key: 'disclosure',   label: '不動產說明書' },
  { key: 'inspection',   label: '物調表' },
  { key: 'sales_dm',     label: '銷售 DM' },
  { key: 'listing_591',  label: '591 文案' },
  { key: 'social_post',  label: '社群貼文' },
] as const;

export type DocFlagKey = typeof DOC_FLAG_DEFS[number]['key'];
export type DocFlagsMap = Record<DocFlagKey, boolean>;

// 從 DB 讀取所有 doc flags，缺少的 key 補預設值（true）
function readDocFlags(): DocFlagsMap {
  const rows = db.prepare(
    'SELECT key, enabled FROM feature_flags WHERE key IN (?, ?, ?, ?, ?)'
  ).all(
    'disclosure', 'inspection', 'sales_dm', 'listing_591', 'social_post'
  ) as Array<{ key: string; enabled: number }>;

  // 先建預設值（全部啟用），再用 DB 資料覆蓋
  const result: DocFlagsMap = {
    disclosure:  true,
    inspection:  true,
    sales_dm:    true,
    listing_591: true,
    social_post: true,
  };
  for (const row of rows) {
    if (row.key in result) {
      (result as Record<string, boolean>)[row.key] = row.enabled === 1;
    }
  }
  return result;
}

// GET /api/admin/doc-flags
// 回傳 5 種文件類型的啟用狀態：{ disclosure: true, inspection: false, ... }
export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  return NextResponse.json(readDocFlags());
}

// PATCH /api/admin/doc-flags
// 接受 body { [key: DocFlagKey]: boolean }，更新指定 key 的啟用狀態
// 回傳更新後的完整設定
export async function PATCH(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  let body: Record<string, boolean>;
  try {
    body = (await req.json()) as Record<string, boolean>;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  // 有效的 key 白名單，避免任意寫入 feature_flags 表
  const validKeysList = DOC_FLAG_DEFS.map((d) => d.key as string);

  // 用 INSERT OR REPLACE 更新每個合法 key
  const upsert = db.prepare(
    'INSERT OR REPLACE INTO feature_flags (key, enabled) VALUES (?, ?)'
  );
  const upsertMany = db.transaction((entries: Array<[string, number]>) => {
    for (const [key, enabled] of entries) {
      upsert.run(key, enabled);
    }
  });

  const entries: Array<[string, number]> = Object.entries(body)
    .filter(([key]) => validKeysList.includes(key))
    .map(([key, val]) => [key, val ? 1 : 0]);
  if (entries.length > 0) {
    upsertMany(entries);
  }

  // 回傳更新後的完整設定
  return NextResponse.json(readDocFlags());
}
