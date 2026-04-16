import { NextResponse } from 'next/server';
import { getListing } from '@/lib/db';

const statusMessages: Record<string, string> = {
  draft: '請先完成現場勘查資料（業務填寫）',
  'field-visit-complete': '請先完成補充資料（秘書填寫）',
  'documents-ready': '文件已產出完成'
};

import type { NextRequest } from 'next/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (listing.status !== 'ready-for-generation') {
    return NextResponse.json({
      error: 'not-ready',
      currentStatus: listing.status,
      message: statusMessages[listing.status] || '尚未準備好產生文件'
    }, { status: 422 });
  }
  return NextResponse.json({ ok: true, message: '文件產出中...' });
}

