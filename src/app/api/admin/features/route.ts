import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const LICENSE_CONFIG_PATH = path.join(process.cwd(), 'data', 'licenses.json');

export interface LicenseEntry {
  licenseKey: string;
  email: string;
  clientName: string;
  features: string[];
  active: boolean;
  note?: string;
}

export const ALL_FEATURES = [
  { key: 'disclosure-document', label: '不動產說明書' },
  { key: 'contract', label: '買賣契約' },
  { key: 'marketing', label: '行銷文案' },
];

function readLicenses(): LicenseEntry[] {
  try {
    const raw = fs.readFileSync(LICENSE_CONFIG_PATH, 'utf8');
    return JSON.parse(raw) as LicenseEntry[];
  } catch {
    return [];
  }
}

function writeLicenses(entries: LicenseEntry[]): void {
  fs.mkdirSync(path.dirname(LICENSE_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(LICENSE_CONFIG_PATH, JSON.stringify(entries, null, 2));
}

export async function GET() {
  return NextResponse.json({ licenses: readLicenses(), allFeatures: ALL_FEATURES });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<LicenseEntry>;
  if (!body.licenseKey || !body.email) {
    return NextResponse.json({ error: 'licenseKey and email required' }, { status: 400 });
  }
  const entries = readLicenses();
  const existing = entries.findIndex((e) => e.licenseKey === body.licenseKey);
  const entry: LicenseEntry = {
    licenseKey: body.licenseKey,
    email: body.email,
    clientName: body.clientName ?? '',
    features: body.features ?? ['disclosure-document'],
    active: body.active ?? true,
    note: body.note,
  };
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  writeLicenses(entries);
  return NextResponse.json({ ok: true, entry });
}
