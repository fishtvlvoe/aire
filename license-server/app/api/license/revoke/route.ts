import { NextRequest, NextResponse } from 'next/server';
import { hasValidAdminTokenFromHeaders } from '../../../../lib/admin-auth';
import { revokeLicense } from '../../../../lib/store';

export const runtime = 'nodejs';

interface RevokeBody {
  licenseKey?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  if (!hasValidAdminTokenFromHeaders(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as RevokeBody;
  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  if (!licenseKey) {
    return NextResponse.json({ error: 'licenseKey is required' }, { status: 400 });
  }

  const revoked = await revokeLicense(
    licenseKey,
    typeof body.reason === 'string' ? body.reason.trim() : undefined,
  );
  if (!revoked) {
    return NextResponse.json({ error: 'license_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status: revoked.status,
    revokedAt: revoked.revokedAt,
    revokedReason: revoked.revokedReason,
  }, { status: 200 });
}
