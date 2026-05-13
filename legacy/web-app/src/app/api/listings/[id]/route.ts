import { NextRequest, NextResponse } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { archiveListing, getListing, updateMarketSummary } from '@/lib/db';
import type { ExtractedDataPayload } from '@/lib/ocr';
import { listingUpdateSchema, validationError } from '@/lib/validation/schemas';

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

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, listingId);
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.message, code: access.code },
      { status: access.status },
    );
  }
  const listing = access.listing;

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

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, listingId);
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.message, code: access.code },
      { status: access.status },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid json', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  const parsed = listingUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const body = parsed.data;

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
    updateMarketSummary(listingId, normalized, user!.id);
  }

  const updated = getListing(listingId);
  return NextResponse.json({ listing: updated });
}

// DELETE uses archive semantics so the listing remains auditable.
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, listingId);
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.message, code: access.code },
      { status: access.status },
    );
  }

  const success = archiveListing(listingId, user!.id);
  if (!success) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing already archived', code: 'ALREADY_ARCHIVED' },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true, listing: getListing(listingId) });
}
