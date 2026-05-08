import { NextResponse } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { updateSupplementaryData } from '@/lib/db';
import { supplementarySchema, validationError } from '@/lib/validation/schemas';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, numId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, code: access.code }, { status: access.status });
  }
  const listing = access.listing;
  if (listing.field_visit_status !== 'field-visit-complete') {
    return NextResponse.json({
      error: 'field-visit-incomplete',
      missing: 'Field visit data must be completed before supplementary data'
    }, { status: 422 });
  }
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = supplementarySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const body = parsed.data;
  updateSupplementaryData(numId, body.data, user!.id);
  return NextResponse.json({ ok: true, status: 'ready-for-generation' });
}
