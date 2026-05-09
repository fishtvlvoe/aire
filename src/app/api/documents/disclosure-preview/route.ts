import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { db } from '@/lib/db';
import { DEFAULT_CONTENT_FIELDS, DEFAULT_COVER_FIELDS, type FieldPosition } from '@/lib/branding/field-layouts';

type JsonRecord = Record<string, unknown>;

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

function normalizeValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function getFallbackFieldValue(field: FieldPosition, listing: {
  id: number;
  address?: string | null;
  field_visit_data: string | null;
  supplementary_data: string | null;
}): string {
  const supplementary = safeParseObject(listing.supplementary_data);
  const fieldVisit = safeParseObject(listing.field_visit_data);

  const mapping: Record<string, unknown> = {
    'object-id': listing.id,
    'object-name': supplementary.property_name ?? fieldVisit.address ?? listing.address,
    'agent-name': supplementary.owner_name ?? fieldVisit.owner_name,
    'store-name': supplementary.store_name ?? supplementary.store ?? '',
    'broker-name': supplementary.agent_name ?? supplementary.broker_name,
    'broker-cert': supplementary.agent_cert ?? supplementary.broker_cert,
    'company-name': supplementary.company_name,
    'company-address': supplementary.company_address ?? listing.address,
    'company-phone': supplementary.company_phone ?? supplementary.agent_phone,
    'document-date': new Date().toISOString().slice(0, 10),
  };

  return normalizeValue(mapping[field.fieldKey]);
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const listingId = Number(requestUrl.searchParams.get('listingId'));
  if (!Number.isInteger(listingId)) {
    return NextResponse.json({ error: 'listingId 無效', code: 'INVALID_REQUEST' }, { status: 400 });
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
  const overrides = (docs.disclosure_overrides && typeof docs.disclosure_overrides === 'object')
    ? (docs.disclosure_overrides as JsonRecord)
    : {};

  const bgRows = db.prepare(
    'SELECT key, value FROM feature_flags WHERE key IN (?, ?)'
  ).all('doc_bg_cover', 'doc_bg_content') as Array<{ key: string; value: string | null }>;
  const backgrounds = {
    cover: (bgRows.find((row) => row.key === 'doc_bg_cover')?.value || null),
    content: (bgRows.find((row) => row.key === 'doc_bg_content')?.value || null),
  };

  const fields = [...DEFAULT_COVER_FIELDS, ...DEFAULT_CONTENT_FIELDS].map((field) => {
    const overrideValue = overrides[field.fieldKey];
    const value = overrideValue !== undefined
      ? normalizeValue(overrideValue)
      : getFallbackFieldValue(field, listing);
    return {
      fieldKey: field.fieldKey,
      label: field.label,
      value,
      page: field.page,
      position: {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        fontSize: field.fontSize,
        textAlign: field.textAlign,
      },
    };
  });

  return NextResponse.json({
    listingId,
    backgrounds,
    fields,
  });
}
