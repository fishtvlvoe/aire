import { NextRequest, NextResponse } from 'next/server';
import { CodexFormalGenerator, HaikuMarketingGenerator, GeminiSocialGenerator } from '@/lib/document-generator';
import { getListing, updateDocuments } from '@/lib/db';

const PROVIDER_MAP = {
  disclosure_document: CodexFormalGenerator,
  property_survey: CodexFormalGenerator,
  listing_591: HaikuMarketingGenerator,
  sales_dm: HaikuMarketingGenerator,
  social_posts: GeminiSocialGenerator,
  short_video_script: GeminiSocialGenerator,
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { documentType } = await req.json();
  if (!documentType || !(documentType in PROVIDER_MAP)) {
    return NextResponse.json({ error: 'Invalid documentType' }, { status: 422 });
  }
  const listing = getListing(Number(id));
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'documents-ready') {
    return NextResponse.json({ error: 'Listing status must be documents-ready' }, { status: 422 });
  }
  let generator;
  try {
    generator = new (PROVIDER_MAP as Record<string, new () => { generate: (input: unknown) => Promise<unknown> }>)[documentType]();
  } catch (e) {
    return NextResponse.json({ error: 'Provider error' }, { status: 422 });
  }
  let newContent;
  try {
    newContent = await generator.generate(listing);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 422 });
  }
  let docs: Record<string, unknown> = {};
  try {
    docs = listing.generated_documents ? JSON.parse(listing.generated_documents) : {};
  } catch (e) {
    docs = {};
  }
  docs[documentType] = newContent;
  updateDocuments(listing.id, docs);
  return NextResponse.json({ ok: true, documentType, updated: newContent });
}
