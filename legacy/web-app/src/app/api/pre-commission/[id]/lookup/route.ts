import { NextResponse } from 'next/server';
import { getListing } from '@/lib/db';
import { lookupPreCommissionData } from '@/lib/pre-commission/lookup';
import { getDataApiBaseUrl } from '@/lib/api-client';
import { queryRealPrice } from '@/lib/api-client/real-price';

/**
 * 委託前資料查詢。
 *
 * Hybrid-architecture 策略：
 *  1. 若雲端 DATA_API_URL 已設定 → 優先呼叫雲端 `queryRealPrice`（集中維護爬蟲）
 *  2. 雲端不可用或回 unavailable → fallback 至既有 `lookupPreCommissionData`（直接打 lvr.land.moi 官方 OData）
 *  3. 本地查詢失敗 → 回 500
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const listingId = Number(id);
    if (Number.isNaN(listingId)) {
      return NextResponse.json({ error: '物件編號錯誤' }, { status: 400 });
    }

    const listing = getListing(listingId);
    if (!listing) {
      return NextResponse.json({ error: '物件不存在' }, { status: 404 });
    }

    const preCommissionData = listing.pre_commission_data
      ? (JSON.parse(listing.pre_commission_data) as Record<string, unknown>)
      : null;

    const address = typeof preCommissionData?.address === 'string' ? preCommissionData.address : '';
    const parcelNumber =
      typeof preCommissionData?.parcel_number === 'string'
        ? preCommissionData.parcel_number
        : undefined;

    // 優先試雲端 API（若有設定 DATA_API_URL）
    if (getDataApiBaseUrl() && address) {
      const cityMatch = address.match(/^(\S+?(?:市|縣))/u);
      const districtMatch = address.match(/^\S+?(?:市|縣)(\S+?(?:區|鄉|鎮|市))/u);
      if (cityMatch?.[1]) {
        const cloudResult = await queryRealPrice({
          city: cityMatch[1],
          district: districtMatch?.[1],
        });
        if (cloudResult.available && cloudResult.data) {
          return NextResponse.json({
            lookup_data: {
              realPrice: {
                source: 'cloud-data-api',
                data: { record_count: String(cloudResult.data.total) },
                rawText: JSON.stringify(cloudResult.data, null, 2),
              },
              cadastral: null,
              timestamp: new Date().toISOString(),
            },
            source: 'cloud',
          });
        }
        // cloudResult.available === false → fall through to local lookup below
      }
    }

    const report = await lookupPreCommissionData({ address, parcelNumber });

    return NextResponse.json({ lookup_data: report, source: 'local' });
  } catch {
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}
