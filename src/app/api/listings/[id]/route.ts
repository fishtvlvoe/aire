import { NextResponse } from 'next/server';
import { getListing } from '@/lib/db';

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
