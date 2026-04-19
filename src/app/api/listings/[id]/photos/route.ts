// 法規照片上傳 endpoint — 依《不動產說明書應記載事項》要求，照片為物件實況佐證必要附件

import * as fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

// MVP 階段硬限制：單檔 10MB、僅限圖片
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif)$/i;
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const formData = await req.formData();

  const filenames: string[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const file = value;

    // MIME 檢查
    if (!ALLOWED_MIME.test(file.type)) {
      return NextResponse.json(
        { error: `不支援的檔案類型：${file.type}` },
        { status: 400 },
      );
    }

    // 大小檢查
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `檔案 ${file.name} 超過 10MB 限制` },
        { status: 413 },
      );
    }

    // 副檔名白名單（雙重保險，防止 MIME spoof）
    const ext = path.extname(path.basename(file.name)).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: `不支援的副檔名：${ext}` },
        { status: 400 },
      );
    }

    // UUID prefix 避免並發碰撞；保留副檔名便於辨識
    const filename = `${crypto.randomUUID()}${ext}`;
    const dir = path.join(
      process.cwd(),
      'public/uploads/listings',
      String(listingId),
    );

    await fs.promises.mkdir(dir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await fs.promises.writeFile(
      path.join(dir, filename),
      Buffer.from(arrayBuffer),
    );

    filenames.push(filename);
  }

  return NextResponse.json({ filenames });
}
