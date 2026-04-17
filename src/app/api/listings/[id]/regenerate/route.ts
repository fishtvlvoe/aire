import { NextRequest, NextResponse } from 'next/server';
import { CodexDocumentGenerator } from '@/lib/document-generator';
import { getListing, updateDocuments } from '@/lib/db';

const VALID_TYPES = ['disclosure_document', 'property_survey', 'listing_591', 'sales_dm', 'social_posts', 'short_video_script'];

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { documentType } = await req.json();
  if (!documentType || !VALID_TYPES.includes(documentType)) {
    return NextResponse.json({ error: 'Invalid documentType' }, { status: 422 });
  }
  const listing = getListing(Number(id));
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'documents-ready') {
    return NextResponse.json({ error: 'Listing status must be documents-ready' }, { status: 422 });
  }
  const generator = new CodexDocumentGenerator();
  let newDocs;
  try {
    newDocs = await generator.generate(listing);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 422 });
  }
  let docs: Record<string, unknown> = {};
  try {
    docs = listing.generated_documents ? JSON.parse(listing.generated_documents) : {};
  } catch {
    docs = {};
  }
  docs[documentType] = (newDocs as Record<string, unknown>)[documentType];
  updateDocuments(listing.id, docs);
  return NextResponse.json({ ok: true, documentType, updated: docs[documentType] });
}
