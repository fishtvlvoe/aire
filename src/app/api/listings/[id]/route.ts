import { NextResponse } from 'next/server';
import { deleteListing, getListing, updateMarketSummary } from '@/lib/db';

const MARKET_SUMMARY_MAX_LENGTH = 500;

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

/**
 * PATCH /api/listings/[id]
 * 目前支援的欄位：market_summary（周邊行情摘要，最多 500 字元；傳 null 或空字串可清除）。
 * 未來新增其他可編輯欄位時擴充此 endpoint。
 */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let body: { market_summary?: unknown };
  try {
    body = (await req.json()) as { market_summary?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if ('market_summary' in body) {
    const value = body.market_summary;
    if (value !== null && typeof value !== 'string') {
      return NextResponse.json(
        { error: 'market_summary must be string or null' },
        { status: 400 },
      );
    }
    if (typeof value === 'string' && value.length > MARKET_SUMMARY_MAX_LENGTH) {
      return NextResponse.json(
        { error: `market_summary exceeds ${MARKET_SUMMARY_MAX_LENGTH} character limit` },
        { status: 422 },
      );
    }
    const normalized = typeof value === 'string' && value.trim() === '' ? null : (value as string | null);
    updateMarketSummary(listingId, normalized);
  }

  const updated = getListing(listingId);
  return NextResponse.json({ listing: updated });
}

// 需求（Requirement）：Listings 支援透過 DELETE API 進行硬刪除（hard delete）。
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const success = deleteListing(listingId);
  if (!success) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
