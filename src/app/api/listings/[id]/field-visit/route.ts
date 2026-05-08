import { NextResponse } from 'next/server';
import { db, updateListingFieldVisit, getListing, type FieldVisitStatus } from '@/lib/db';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { getAllFieldsForVisit } from '@/lib/form-renderer';
import type { PropertyType } from '@/lib/property-types';
import type { ExtractedDataPayload } from '@/lib/ocr';
import { fieldVisitSchema, validationError } from '@/lib/validation/schemas';

import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// 統一 error payload 型別
// ─────────────────────────────────────────────
interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, numId);
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.message, code: access.code },
      { status: access.status },
    );
  }
  const listing = access.listing;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid json', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  const parsed = fieldVisitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const body = parsed.data;
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
        { error: 'missing-required-fields', code: 'INVALID_REQUEST', fields: missingFields },
        { status: 422 },
      );
    }
  }

  const newStatus: FieldVisitStatus = isComplete ? 'field-visit-complete' : 'field-visit-incomplete';
  updateListingFieldVisit(numId, data, newStatus, user!.id);

  // ─────────────────────────────────────────────
  // 若 extracted_data 存在，將業務修改過的欄位的 provenance 標記為 'manual-edit'
  // ─────────────────────────────────────────────
  const freshListing = getListing(numId);
  if (freshListing?.extracted_data) {
    try {
      const extracted = JSON.parse(freshListing.extracted_data) as ExtractedDataPayload;
      const mergedFields = extracted.merged_fields ?? {};
      let changed = false;

      for (const fieldKey of Object.keys(data)) {
        if (fieldKey in mergedFields && mergedFields[fieldKey].provenance !== 'manual-edit') {
          mergedFields[fieldKey] = { ...mergedFields[fieldKey], provenance: 'manual-edit' };
          changed = true;
        }
      }

      // 只在有欄位實際變動時才更新 DB，避免無謂寫入
      if (changed) {
        extracted.merged_fields = mergedFields;
        db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
          JSON.stringify(extracted),
          numId,
        );
      }
    } catch {
      // extracted_data 格式損壞時靜默忽略，不影響正常儲存
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
