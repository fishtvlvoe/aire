import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getListing } from '@/lib/db';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!listing.generated_documents) return NextResponse.json({ error: 'documents not generated yet' }, { status: 422 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'disclosure';
  const docs = JSON.parse(listing.generated_documents) as Record<string, unknown>;

  const contentMap: Record<string, string> = {
    disclosure: String(docs.disclosure_document || ''),
    survey: String(docs.property_survey || ''),
    'sales-dm': String(docs.sales_dm || ''),
  };
  const content = contentMap[type] || '';
  const fieldVisitData = listing.field_visit_data ? JSON.parse(listing.field_visit_data) as Record<string, unknown> : {};
  const address = String(fieldVisitData.address || '未知地址');

  const title = type === 'disclosure' ? '不動產說明書' : type === 'survey' ? '物調表' : '銷售DM';
  const bodyContent = content
    ? `<pre style="white-space:pre-wrap;word-break:break-all;">${content}</pre>`
    : `<p style="color:#888;">尚未產生內容</p>`;
  const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:'Noto Sans TC',sans-serif;padding:2rem;font-size:14px;line-height:1.8;}h1{font-size:1.4rem;color:#1B3A6B;}pre{white-space:pre-wrap;word-break:break-all;}</style></head><body><h1>${title}</h1><p style="color:#666;margin-bottom:1.5rem;">物件地址：${address}</p>${bodyContent}</body></html>`;

  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = (await import('puppeteer')).default as unknown as typeof import('puppeteer');
  } catch {
    return NextResponse.json({ error: 'puppeteer not available' }, { status: 500 });
  }

  const launchOptions = process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    : {};

  const browser = await (puppeteer as any).launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}-${id}.pdf"`,
    },
  });
}
