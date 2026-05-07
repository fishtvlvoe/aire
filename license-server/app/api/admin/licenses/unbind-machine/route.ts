import { NextRequest, NextResponse } from 'next/server';
import { unbindMachine } from '../../../../../lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as { licenseKey?: unknown };
  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';

  const updated = await unbindMachine(licenseKey);
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
