import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, getSessionUser } from '@/lib/auth';
import { getFolder, getListing, moveListingToFolder } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
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

  let body: { folder_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const rawFolderId = body.folder_id;
  if (rawFolderId !== null && typeof rawFolderId !== 'number') {
    return NextResponse.json(
      { error: 'folder_id must be a number or null', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  if (typeof rawFolderId === 'number') {
    if (!getFolder(rawFolderId)) {
      return NextResponse.json({ error: '資料夾不存在', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  moveListingToFolder(listingId, rawFolderId as number | null);
  return NextResponse.json({ listing: getListing(listingId) });
}
