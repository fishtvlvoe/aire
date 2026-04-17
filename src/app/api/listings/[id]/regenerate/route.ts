import { NextRequest, NextResponse } from 'next/server';
import { getListing, updateDocuments } from '@/lib/db';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';
import { generateSurvey } from '@/lib/document-generator/md/survey';
import { generateListing591 } from '@/lib/document-generator/md/listing591';
import { generateDm } from '@/lib/document-generator/md/dm';
import { generateSocialPosts } from '@/lib/document-generator/md/social';
import { generateBuildingDossier } from '@/lib/document-generator/pdf/dossier-building';
import { generateLandDossier } from '@/lib/document-generator/pdf/dossier-land';

const VALID_TYPES = [
  'property_survey',
  'listing_591',
  'sales_dm',
  'social_posts',
  'disclosure_document',
] as const;

type DocumentType = typeof VALID_TYPES[number];

const LAND_TYPES = [
  'farmland',
  'residential-land',
  'commercial-land',
  'industrial-land',
  'rural-land',
  'other-land',
] as const;

function isLandType(propertyType: string): boolean {
  return (LAND_TYPES as readonly string[]).includes(propertyType);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const { documentType } = await req.json();
  if (!documentType || !VALID_TYPES.includes(documentType as DocumentType)) {
    return NextResponse.json({ error: 'Invalid documentType', validTypes: VALID_TYPES }, { status: 422 });
  }

  const listing = getListing(numId);
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'documents-ready') {
    return NextResponse.json({ error: 'Listing status must be documents-ready' }, { status: 422 });
  }

  const input: DocumentGeneratorInput = {
    property_type: listing.property_type,
    field_visit_data: listing.field_visit_data ? JSON.parse(listing.field_visit_data as string) : {},
    supplementary_data: listing.supplementary_data ? JSON.parse(listing.supplementary_data as string) : {},
  };

  let newContent: string;
  try {
    const type = documentType as DocumentType;
    if (type === 'property_survey') {
      newContent = await generateSurvey(input);
    } else if (type === 'listing_591') {
      newContent = await generateListing591(input);
    } else if (type === 'sales_dm') {
      newContent = await generateDm(input);
    } else if (type === 'social_posts') {
      newContent = await generateSocialPosts(input);
    } else {
      // disclosure_document — land vs building
      if (isLandType(listing.property_type)) {
        newContent = await generateLandDossier(input);
      } else {
        newContent = await generateBuildingDossier(input);
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // 讀現有文件，替換單一欄位
  let docs: Record<string, unknown> = {};
  try {
    docs = listing.generated_documents ? JSON.parse(listing.generated_documents as string) : {};
  } catch {
    docs = {};
  }
  docs[documentType] = newContent;
  updateDocuments(numId, docs);

  return NextResponse.json({ ok: true, documentType, updated: newContent });
}
