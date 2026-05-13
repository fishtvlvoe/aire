import { NextRequest, NextResponse } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { getListing, restoreListing } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Ctx) {
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

  const ok = restoreListing(listingId, user!.id);
  if (!ok) {
    return NextResponse.json({ error: '物件未封存', code: 'NOT_ARCHIVED' }, { status: 409 });
  }

  return NextResponse.json({ listing: getListing(listingId) });
}
