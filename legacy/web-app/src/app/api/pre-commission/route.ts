import { NextResponse } from 'next/server';
import { createPreCommissionListing } from '@/lib/db';

interface PreCommissionRequestBody {
  owner_name: string;
  owner_phone: string;
  address: string;
  parcel_number?: string;
  property_type: string;
  notes?: string;
}

const REQUIRED_FIELDS: Array<keyof Pick<PreCommissionRequestBody, 'owner_name' | 'owner_phone' | 'address' | 'property_type'>> = [
  'owner_name',
  'owner_phone',
  'address',
  'property_type',
];

function hasMissingRequiredField(body: Partial<PreCommissionRequestBody>): boolean {
  return REQUIRED_FIELDS.some((field) => {
    const value = body[field];
    return typeof value !== 'string' || value.trim() === '';
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PreCommissionRequestBody>;

    if (hasMissingRequiredField(body)) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
    }

    const created = createPreCommissionListing({
      owner_name: body.owner_name!,
      owner_phone: body.owner_phone!,
      address: body.address!,
      parcel_number: body.parcel_number?.trim() ?? '',
      property_type: body.property_type!,
      notes: body.notes,
    } as Parameters<typeof createPreCommissionListing>[0]);

    const id = typeof created === 'number' ? created : created.id;

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: '建立失敗' }, { status: 500 });
  }
}
