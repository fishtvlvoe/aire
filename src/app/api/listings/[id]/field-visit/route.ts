import { NextResponse } from 'next/server';
import { updateListingFieldVisit, getListing, type FieldVisitStatus } from '@/lib/db';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: { data: Record<string, unknown>; isComplete: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { data, isComplete } = body;
  const newStatus: FieldVisitStatus = isComplete ? 'field-visit-complete' : 'field-visit-incomplete';
  updateListingFieldVisit(numId, data, newStatus);
  return NextResponse.json({ ok: true, status: newStatus });
}

