import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { createListing, searchListings } from '@/lib/db';
import { listingCreateSchema, validationError } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const ownerId = user.role !== 'admin' ? user.id : undefined;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? undefined;
  const archivedParam = searchParams.get('archived') ?? 'false';
  const archived = (archivedParam === 'true' || archivedParam === 'all') ? archivedParam : 'false';
  const folderParam = searchParams.get('folder_id');
  const folderId = folderParam === 'none' ? 'none'
    : folderParam !== null && !Number.isNaN(Number(folderParam)) ? Number(folderParam)
    : undefined;

  const listings = searchListings({ ownerId, q, archived, folderId, limit: 50 });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = listingCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const { propertyType } = parsed.data;
  try {
    const listing = createListing(propertyType, 'draft', user.id);
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
