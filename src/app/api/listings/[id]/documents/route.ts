import { NextRequest, NextResponse } from 'next/server';
import { getListing } from '@/lib/db';

type DocumentStatus = 'ready' | 'not-generated';

interface DocumentEntry {
  status: DocumentStatus;
  content?: string;
  pdfUrl?: string;
}

interface DocumentsResponse {
  documents: {
    property_survey: DocumentEntry;
    listing_591: DocumentEntry;
    sales_dm: DocumentEntry;
    social_posts: DocumentEntry;
    disclosure_document: DocumentEntry;
  };
}

const DOCUMENT_KEYS = [
  'property_survey',
  'listing_591',
  'sales_dm',
  'social_posts',
  'disclosure_document',
] as const;

type DocumentKey = typeof DOCUMENT_KEYS[number];

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const listing = getListing(numId);
  if (!listing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let storedDocs: Record<string, unknown> = {};
  try {
    storedDocs = listing.generated_documents
      ? JSON.parse(listing.generated_documents as string)
      : {};
  } catch {
    storedDocs = {};
  }

  const documents = {} as DocumentsResponse['documents'];

  for (const key of DOCUMENT_KEYS) {
    const value = storedDocs[key];
    const hasContent = typeof value === 'string' && value.length > 0;

    if (key === 'disclosure_document') {
      documents[key] = hasContent
        ? { status: 'ready', content: value as string, pdfUrl: `/api/listings/${numId}/pdf` }
        : { status: 'not-generated' };
    } else {
      const typedKey = key as Exclude<DocumentKey, 'disclosure_document'>;
      documents[typedKey] = hasContent
        ? { status: 'ready', content: value as string }
        : { status: 'not-generated' };
    }
  }

  return NextResponse.json({ documents } satisfies DocumentsResponse);
}
