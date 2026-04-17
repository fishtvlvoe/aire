import { NextResponse } from 'next/server';
import { advanceToFieldVisit } from '@/lib/db';

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const listingId = Number(id);

    if (Number.isNaN(listingId)) {
      return NextResponse.json({ error: '物件編號格式錯誤' }, { status: 400 });
    }

    advanceToFieldVisit(listingId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'listing-not-found') {
      return NextResponse.json({ error: '物件不存在' }, { status: 404 });
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'invalid-transition'
    ) {
      return NextResponse.json({ error: '狀態不符合' }, { status: 400 });
    }

    return NextResponse.json({ error: '操作失敗' }, { status: 500 });
  }
}
