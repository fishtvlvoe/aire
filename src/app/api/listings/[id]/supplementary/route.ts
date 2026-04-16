import { NextResponse } from 'next/server';
import { getListing, updateSupplementaryData } from '@/lib/db';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (listing.field_visit_status !== 'field-visit-complete') {
    return NextResponse.json({
      error: 'field-visit-incomplete',
      missing: 'Field visit data must be completed before supplementary data'
    }, { status: 422 });
  }
  let body: { data: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  updateSupplementaryData(numId, body.data);
  return NextResponse.json({ ok: true, status: 'ready-for-generation' });
}

