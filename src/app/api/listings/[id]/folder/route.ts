import { NextRequest, NextResponse } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { getFolder, getListing, moveListingToFolder } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const listingId = Number(id);
  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, listingId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, code: access.code }, { status: access.status });
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
