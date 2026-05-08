import { NextResponse } from 'next/server';
import { verifyLicense } from '@/lib/license/server-verify';
import { cookies } from 'next/headers';

/** Electron 主進程在啟動時呼叫此 endpoint，驗證 license 並設置 session cookie */
export async function POST(req: Request) {
  const { email, licenseKey } = (await req.json()) as {
    email?: string;
    licenseKey?: string;
  };

  if (!email || !licenseKey) {
    return NextResponse.json({ error: 'email and licenseKey required' }, { status: 400 });
  }

  const result = await verifyLicense(email, licenseKey);

  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: 'License verification failed' }, { status: 403 });
  }

  // 若 License Server 回傳廠商帳號資訊，靜默佈建 vendor 帳號
  if (result.vendorCredentials) {
    const { provisionVendorAccount } = await import('@/lib/auth/vendor');
    provisionVendorAccount(result.vendorCredentials);
  }

  const cookieStore = await cookies();
  cookieStore.set('license_valid', '1', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 小時
    path: '/',
  });
  cookieStore.set('license_features', JSON.stringify(result.features), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({ valid: true, features: result.features });
}
