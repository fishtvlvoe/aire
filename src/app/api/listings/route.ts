import { NextResponse } from 'next/server';
import { getAllListings, createListing, type PropertyType } from '@/lib/db';

export async function GET() {
  const listings = getAllListings();
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  let body: { propertyType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { propertyType } = body;
  try {
    const listing = createListing(propertyType);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    if (message === 'invalid-property-type') {
      return NextResponse.json({ error: 'invalid-property-type' }, { status: 400 });
    }
    if (message === 'type-not-available') {
      return NextResponse.json({ error: 'type-not-available' }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
