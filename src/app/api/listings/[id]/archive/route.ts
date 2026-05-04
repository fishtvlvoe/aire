import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { SESSION_COOKIE, getSessionUser } from '@/lib/auth';
import { archiveListing, getListing } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const listingId = Number(id);
  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: 'listing not found', code: 'LISTING_NOT_FOUND' }, { status: 404 });
  }

  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;
  if (user?.role === 'agent' && listing.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const ok = archiveListing(listingId);
  if (!ok) {
    return NextResponse.json({ error: '物件已封存', code: 'ALREADY_ARCHIVED' }, { status: 409 });
  }

  if (user) {
    writeAuditLog(user.id, 'archive_listing', 'listing', listingId, `封存物件 #${listingId}`);
  }
  return NextResponse.json({ listing: getListing(listingId) });
}
