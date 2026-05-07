import { NextRequest, NextResponse } from 'next/server';
import { updateLicenseInfo } from '../../../../../lib/store';

export const runtime = 'nodejs';

type EditableField = 'contactName' | 'company' | 'email';
const EDITABLE_FIELDS: EditableField[] = ['contactName', 'company', 'email'];

function toNullableText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableEmail(value: unknown): string | null {
  const text = toNullableText(value);
  return text ? text.toLowerCase() : null;
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    licenseKey?: unknown;
    field?: unknown;
    value?: unknown;
  };

  const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  const field = typeof body.field === 'string' ? body.field : '';
  if (!EDITABLE_FIELDS.includes(field as EditableField)) {
    return NextResponse.json({ error: 'invalid_field' }, { status: 400 });
  }

  const value = field === 'email' ? toNullableEmail(body.value) : toNullableText(body.value);
  const updated = await updateLicenseInfo(licenseKey, field as EditableField, value);
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
