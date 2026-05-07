import { NextRequest, NextResponse } from 'next/server';
import { getLicense, revokeLicense } from '../../../../../lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as { licenseKey?: unknown; reason?: unknown };
  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  const existing = await getLicense(licenseKey);
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await revokeLicense(licenseKey, reason);
  return NextResponse.json({ ok: true });
}
