import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { SESSION_COOKIE, getSessionUser } from '@/lib/auth';
import { createListing, listRecentListings } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;
  const ownerId = user?.role === 'agent' ? user.id : undefined;
  const listings = listRecentListings(10, ownerId);
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  const user = sessionId ? getSessionUser(sessionId) : null;

  let body: { propertyType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { propertyType } = body;
  try {
    const listing = createListing(propertyType, 'draft', user?.id);
    if (user) {
      writeAuditLog(user.id, 'create_listing', 'listing', listing.id, `建立物件：${propertyType}`);
    }
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    if (message === 'invalid-property-type') {
      return NextResponse.json({ error: 'invalid-property-type' }, { status: 400 });
    }
    if (message === 'type-not-available') {
      return NextResponse.json({ error: 'type-not-available' }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
