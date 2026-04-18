import { NextResponse } from 'next/server';
import { deleteListing, getListing } from '@/lib/db';

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
