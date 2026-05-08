import { NextResponse } from 'next/server';
import { marked } from 'marked';
import { db, getListing } from '@/lib/db';
import { getColorSchemeById } from '@/lib/branding/color-schemes';
import { launchBrowser } from '@/lib/pdf-generator/chromium-launcher';

function getCurrentColorSchemeId(): string {
  const row = db.prepare('SELECT value FROM feature_flags WHERE key = ?').get('doc_color_scheme') as { value?: string } | undefined;
  return row?.value || 'navy';
}

async function buildHtml(markdown: string, schemeId: string): Promise<string> {
  const scheme = getColorSchemeById(schemeId);
  const bodyHtml = await marked.parse(`# 文件輸出\n\n${markdown}`);
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; font-family: 'Noto Sans TC', sans-serif; color: #1e293b; }
      .wrapper { width: 100%; }
      .header { padding: 20px 28px; background: ${scheme.headerBg}; color: ${scheme.headerText}; border-bottom: 5px solid ${scheme.accentColor}; }
      .content { padding: 28px; line-height: 1.75; }
      h1, h2, h3 { color: #1f2937; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">不動產說明書（${scheme.name}）</div>
      <div class="content">${bodyHtml}</div>
    </div>
  </body>
</html>`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { listingId?: unknown } | null;
  const listingIdNum = Number(body?.listingId);
  if (!body?.listingId || Number.isNaN(listingIdNum)) {
    return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 });
  }

  const listing = getListing(listingIdNum);
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const docs = listing.generated_documents
    ? (JSON.parse(listing.generated_documents) as Record<string, unknown>)
    : {};
  const markdown = String(docs.disclosure_document ?? '').trim();
  if (!markdown) {
    return NextResponse.json({ error: 'Disclosure document not generated yet' }, { status: 422 });
  }

  const html = await buildHtml(markdown, getCurrentColorSchemeId());
  const browser = await launchBrowser();
  let pdfBuffer: ArrayBuffer;

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const raw = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });
    pdfBuffer = raw.buffer as ArrayBuffer;
  } finally {
    await browser.close();
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="disclosure-${listingIdNum}.pdf"`,
    },
  });
}
