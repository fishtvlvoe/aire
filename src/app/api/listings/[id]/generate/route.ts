import { NextResponse } from 'next/server';
import { getListing, updateDocuments } from '@/lib/db';
import { createDefaultGenerator } from '@/lib/document-generator';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';

const statusMessages: Record<string, string> = {
  draft: '請先完成現場勘查資料（業務填寫）',
  'field-visit-complete': '請先完成補充資料（秘書填寫）',
  'documents-ready': '文件已產出完成'
};

import type { NextRequest } from 'next/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (listing.status !== 'ready-for-generation') {
    return NextResponse.json({
      error: 'not-ready',
      currentStatus: listing.status,
      message: statusMessages[listing.status] || '尚未準備好產生文件'
    }, { status: 422 });
  }
  try {
    // 1. 解析 field_visit_data 和 supplementary_data
    let field_visit_data = null;
    let supplementary_data = null;
    try {
      field_visit_data = listing.field_visit_data ? JSON.parse(listing.field_visit_data) : null;
    } catch (e) {
      field_visit_data = null;
    }
    try {
      supplementary_data = listing.supplementary_data ? JSON.parse(listing.supplementary_data) : null;
    } catch (e) {
      supplementary_data = null;
    }
    // 2. 組成 DocumentGeneratorInput
    const input: DocumentGeneratorInput = {
      property_type: listing.property_type,
      field_visit_data,
      supplementary_data
    };
    // 3. 呼叫 createDefaultGenerator().generate(input)
    const generator = createDefaultGenerator();
    const result = await generator.generate(input);
    // 4. 呼叫 updateDocuments(numId, result)
    await updateDocuments(numId, result);
    // 5. 回傳結果
    return NextResponse.json({ ok: true, documents: result, downloadUrls: { disclosure: `/api/listings/${numId}/pdf?type=disclosure`, survey: `/api/listings/${numId}/pdf?type=survey`, salesDm: `/api/listings/${numId}/pdf?type=sales-dm` } });
  } catch (error: any) {
    // 錯誤處理
    console.error('文件產生失敗', error);
    let provider = 'unknown';
    let message = error?.message || String(error);
    if (message.includes('Codex')) provider = 'Codex';
    else if (message.includes('Haiku')) provider = 'Haiku';
    else if (message.includes('Gemini')) provider = 'Gemini';
    return NextResponse.json({ error: 'generation-failed', provider, message }, { status: 422 });
  }
}

