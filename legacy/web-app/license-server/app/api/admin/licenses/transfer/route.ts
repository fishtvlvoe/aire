import { NextRequest, NextResponse } from 'next/server';
import { transferLicense } from '../../../../../lib/store';

export const runtime = 'nodejs';

function toNullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableEmail(value: unknown): string | null {
  const text = toNullableText(value);
  return text ? text.toLowerCase() : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    licenseKey?: unknown;
    newContactName?: unknown;
    newCompany?: unknown;
    newEmail?: unknown;
    reason?: unknown;
  };

  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;
  const result = await transferLicense(
    licenseKey,
    {
      contactName: toNullableText(body.newContactName),
      company: toNullableText(body.newCompany),
      email: toNullableEmail(body.newEmail),
    },
    reason,
  );

  if (!result.ok) {
    if (result.error === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'transfer_failed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    newLicenseKey: result.newLicense.licenseKey,
  });
}
