import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getListing, getTemplate } from '@/lib/db';
import { assembleContext, renderTemplate } from '@/lib/template-engine';

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

  return new Response(renderedHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
