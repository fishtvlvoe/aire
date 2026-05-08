import { NextResponse } from 'next/server';
import { marked } from 'marked';
import { db, getListing } from '@/lib/db';
import { getColorSchemeById } from '@/lib/branding/color-schemes';

function getCurrentColorSchemeId(): string {
  const row = db.prepare('SELECT value FROM feature_flags WHERE key = ?').get('doc_color_scheme') as { value?: string } | undefined;
  return row?.value || 'navy';
}

function buildHtml(markdown: string, schemeId: string): Promise<string> {
  const scheme = getColorSchemeById(schemeId);
  return Promise.resolve(marked.parse(`# 文件預覽\n\n${markdown}`)).then((bodyHtml) => `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; font-family: 'Noto Sans TC', sans-serif; background: #f8fafc; color: #1e293b; }
      .wrapper { max-width: 960px; margin: 24px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .header { padding: 18px 24px; background: ${scheme.headerBg}; color: ${scheme.headerText}; border-bottom: 4px solid ${scheme.accentColor}; }
      .content { padding: 24px; line-height: 1.7; }
      h1, h2, h3 { color: #1f2937; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">文件配色預覽（${scheme.name}）</div>
      <div class="content">${bodyHtml}</div>
    </div>
  </body>
</html>`);
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

  const colorScheme = getCurrentColorSchemeId();
  const html = await buildHtml(markdown, colorScheme);
  return NextResponse.json({ html });
}
