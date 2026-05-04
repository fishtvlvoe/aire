import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/** 從 cookie 讀取當前 session 的功能列表 */
export async function GET() {
  const cookieStore = await cookies();
  const featuresRaw = cookieStore.get('license_features')?.value;

  if (!featuresRaw) {
    // 非 production 模式回傳全部功能
    if (process.env.NEXT_PUBLIC_APP_MODE !== 'production') {
      return NextResponse.json({ features: ['disclosure-document', 'contract', 'marketing'] });
    }
    return NextResponse.json({ features: [] });
  }

  try {
    const features = JSON.parse(featuresRaw) as string[];
    return NextResponse.json({ features });
  } catch {
    return NextResponse.json({ features: [] });
  }
}
