import { NextResponse } from 'next/server';
import fs from 'fs';
// NextResponse 接受 ArrayBuffer（BodyInit），避免 Uint8Array TS 型別衝突
import path from 'path';
import { getListing, getTemplate } from '@/lib/db';
import { assembleContext, renderTemplate } from '@/lib/template-engine';
import { launchBrowser } from '@/lib/pdf-generator/chromium-launcher';

export async function POST(req: Request) {
  const body = (await req.json()) as { listingId?: unknown; templateId?: unknown };
  const { listingId, templateId } = body;

  // 驗證並解析 listingId
  const listingIdNum = Number(listingId);
  if (!listingId || isNaN(listingIdNum)) {
    return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 });
  }

  // 驗證並解析 templateId
  const templateIdNum = Number(templateId);
  if (!templateId || isNaN(templateIdNum)) {
    return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 });
  }

  // 查詢物件
  const listing = getListing(listingIdNum);
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // 查詢模板 metadata
  const template = getTemplate(templateIdNum);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // 確認模板 HTML 檔案存在
  const templatePath = path.join(process.cwd(), 'data', 'templates', `${templateIdNum}.html`);
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
  }

  // 讀取模板、合併物件資料、渲染
  const htmlContent = fs.readFileSync(templatePath, 'utf-8');
  const context = assembleContext(listing);
  const renderedHtml = renderTemplate(htmlContent, context);

  // 用既有的 chromium-launcher 啟動瀏覽器（支援本機與 serverless 兩種模式）
  const browser = await launchBrowser();
  let pdfBuffer: ArrayBuffer;

  try {
    const page = await browser.newPage();
    await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
    const raw = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });
    // puppeteer-core 回傳 Uint8Array，取 .buffer 轉成 ArrayBuffer（符合 NextResponse BodyInit）
    pdfBuffer = raw.buffer as ArrayBuffer;
  } finally {
    await browser.close();
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="listing-${listingIdNum}.pdf"`,
    },
  });
}
