import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { db, writeAuditLog } from '@/lib/db';
import { DEFAULT_CONTENT_FIELDS, DEFAULT_COVER_FIELDS } from '@/lib/branding/field-layouts';

type JsonRecord = Record<string, unknown>;

const savePayloadSchema = z.object({
  listingId: z.number().int().positive(),
  fieldKey: z.string().min(1),
  value: z.string(),
});

function safeParseObject(value: string | null | undefined): JsonRecord {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as JsonRecord;
    }
    return {};
  } catch {
    return {};
  }
}

function stripHtmlTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

const ALLOWED_FIELD_KEYS = new Set([
  ...DEFAULT_COVER_FIELDS.map((field) => field.fieldKey),
  ...DEFAULT_CONTENT_FIELDS.map((field) => field.fieldKey),
]);

export async function PATCH(req: NextRequest) {
  const jsonBody = await req.json().catch(() => null);
  const parsed = savePayloadSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: '請求格式錯誤', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const { listingId, fieldKey, value } = parsed.data;
  if (!ALLOWED_FIELD_KEYS.has(fieldKey)) {
    return NextResponse.json({ error: 'fieldKey 不在允許清單', code: 'INVALID_FIELD' }, { status: 400 });
  }

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, listingId);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.message, code: access.code },
      { status: access.status }
    );
  }

  const listing = access.listing;
  const docs = safeParseObject(listing.generated_documents);
  const disclosureOverrides = (
    docs.disclosure_overrides && typeof docs.disclosure_overrides === 'object'
      ? docs.disclosure_overrides
      : {}
  ) as JsonRecord;

  const strippedValue = stripHtmlTags(value);
  docs.disclosure_overrides = {
    ...disclosureOverrides,
    [fieldKey]: strippedValue,
  };

  db.prepare('UPDATE listings SET generated_documents = ? WHERE id = ?')
    .run(JSON.stringify(docs), listingId);

  writeAuditLog({
    action: 'save_disclosure_preview_field',
    targetType: 'listing',
    targetId: listingId,
    userId: user?.id,
    detail: `${fieldKey} updated`,
  });

  return NextResponse.json({ ok: true });
}

