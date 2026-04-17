import { NextResponse } from 'next/server';
import { getListing } from '@/lib/db';
import { lookupPreCommissionData } from '@/lib/pre-commission/lookup';

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

    const report = await lookupPreCommissionData({ address, parcelNumber });

    return NextResponse.json({ lookup_data: report });
  } catch {
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}
