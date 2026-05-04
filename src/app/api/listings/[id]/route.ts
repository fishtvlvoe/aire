import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { SESSION_COOKIE, getSessionUser } from '@/lib/auth';
import { deleteListing, getListing, updateMarketSummary } from '@/lib/db';
import type { ExtractedDataPayload } from '@/lib/ocr';

const MARKET_SUMMARY_MAX_LENGTH = 500;

// ─────────────────────────────────────────────
// 統一 error payload 型別
// ─────────────────────────────────────────────
interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  // agent 只能看自己的物件
  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;
  if (user?.role === 'agent' && listing.owner_id !== user.id) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  // 將 extracted_data 字串轉為物件後一起回傳（null 保持 null）
  let extractedData: ExtractedDataPayload | null = null;
  if (listing.extracted_data) {
    try {
      extractedData = JSON.parse(listing.extracted_data) as ExtractedDataPayload;
    } catch {
      // JSON 損壞時回傳 null，不中斷回應
      extractedData = null;
    }
  }

  return NextResponse.json({ listing: { ...listing, extracted_data: extractedData } });
}

/**
 * PATCH /api/listings/[id]
 * 目前支援的欄位：market_summary（周邊行情摘要，最多 500 字元；傳 null 或空字串可清除）。
 * 未來新增其他可編輯欄位時擴充此 endpoint。
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;
  if (user?.role === 'agent' && listing.owner_id !== user.id) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let body: { market_summary?: unknown };
  try {
    body = (await req.json()) as { market_summary?: unknown };
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid json', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  if ('market_summary' in body) {
    const value = body.market_summary;
    if (value !== null && typeof value !== 'string') {
      return NextResponse.json<ErrorPayload>(
        { error: 'market_summary must be string or null', code: 'INVALID_REQUEST' },
        { status: 400 },
      );
    }
    if (typeof value === 'string' && value.length > MARKET_SUMMARY_MAX_LENGTH) {
      return NextResponse.json<ErrorPayload>(
        {
          error: `market_summary exceeds ${MARKET_SUMMARY_MAX_LENGTH} character limit`,
          code: 'INVALID_REQUEST',
        },
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
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;
  if (user?.role === 'agent' && listing.owner_id !== user.id) {
    return NextResponse.json<ErrorPayload>({ error: 'forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const success = deleteListing(listingId);
  if (!success) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  if (user) {
    writeAuditLog(user.id, 'delete_listing', 'listing', listingId, `刪除物件 #${listingId}`);
  }
  return NextResponse.json({ success: true });
}
