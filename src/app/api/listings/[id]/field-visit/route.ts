import { NextResponse } from 'next/server';
import { updateListingFieldVisit, getListing, type FieldVisitStatus } from '@/lib/db';
import { getAllFieldsForVisit } from '@/lib/form-renderer';
import type { PropertyType } from '@/lib/property-types';

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

  // 後端二次驗證：前端 isComplete 可被 DOM 竄改，
  // 當宣告完成時，重新根據 schema 確認所有 required 欄位有值
  if (isComplete) {
    const propertyType = listing.property_type as PropertyType;
    const { common, categoryCommon, typeSpecific } = getAllFieldsForVisit(propertyType);
    const allFields = [...common, ...categoryCommon, ...typeSpecific];
    const missingFields = allFields
      .filter((f) => f.required)
      .filter((f) => {
        const val = data[f.key];
        return val === undefined || val === null || val === '';
      })
      .map((f) => f.key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'missing-required-fields', fields: missingFields },
        { status: 422 }
      );
    }
  }

  const newStatus: FieldVisitStatus = isComplete ? 'field-visit-complete' : 'field-visit-incomplete';
  updateListingFieldVisit(numId, data, newStatus);
  return NextResponse.json({ ok: true, status: newStatus });
}

