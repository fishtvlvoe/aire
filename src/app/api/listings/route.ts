import { NextResponse } from 'next/server';
import { getAllListings, createListing, type PropertyType } from '@/lib/db';

export async function GET() {
  const listings = getAllListings();
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  let body: { propertyType: PropertyType };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { propertyType } = body;
  if (propertyType !== 'residential' && propertyType !== 'farmland') {
    return NextResponse.json({ error: 'invalid propertyType' }, { status: 400 });
  }
  const listing = createListing(propertyType);
  return NextResponse.json({ listing }, { status: 201 });
}
