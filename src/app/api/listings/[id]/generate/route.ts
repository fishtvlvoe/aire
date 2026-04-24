import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getListing, updateDocuments } from '@/lib/db';
import { createDefaultGenerator } from '@/lib/document-generator';
import type { DocumentGeneratorInput, GeneratedDocuments } from '@/lib/document-generator/types';

const statusMessages: Record<string, string> = {
  draft: '請先完成現場勘查資料（業務填寫），再回到產出頁',
  'documents-ready': '文件已產出完成',
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const listing = getListing(numId);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const VALID_DOC_TYPES = new Set<string>(['property_survey', 'listing_591', 'sales_dm', 'social_posts', 'disclosure_document']);
  const rawType = body.documentType;
  if (rawType !== undefined && !VALID_DOC_TYPES.has(rawType)) {
    return NextResponse.json({ error: 'invalid documentType' }, { status: 400 });
  }
  const documentType = rawType as keyof GeneratedDocuments | undefined;

  // 補充資料章節所有欄位皆為 optional（apartment.supplementary_specific: management_fee/insurance_notes
  // 都 required: false），因此 'field-visit-complete' 應該允許產文件。
  // 強制業務先填補充才能產 = 不必要的阻擋。
  const allowedStatuses = documentType
    ? new Set(['field-visit-complete', 'ready-for-generation', 'documents-ready'])
    : new Set(['field-visit-complete', 'ready-for-generation']);

  if (!allowedStatuses.has(listing.status)) {
    return NextResponse.json(
      {
        error: 'not-ready',
        currentStatus: listing.status,
        message: statusMessages[listing.status] || '尚未完成現勘資料，請先回到「現勘」階段填寫',
      },
      { status: 422 }
    );
  }

  try {
    // 1. 解析 field_visit_data 和 supplementary_data（確保為 object）
    let field_visit_data: Record<string, unknown> = {};
    let supplementary_data: Record<string, unknown> = {};

    try {
      field_visit_data = listing.field_visit_data ? (JSON.parse(listing.field_visit_data) as Record<string, unknown>) : {};
    } catch {
      field_visit_data = {};
    }

    try {
      supplementary_data = listing.supplementary_data
        ? (JSON.parse(listing.supplementary_data) as Record<string, unknown>)
        : {};
    } catch {
      supplementary_data = {};
    }

    // 2. 組成 DocumentGeneratorInput（含 external-market-lookup 的人工填寫資料）
    const allAttachments = (() => {
      if (!listing.attachments) return [];
      try {
        const parsed = JSON.parse(listing.attachments) as unknown;
        return Array.isArray(parsed) ? (parsed as Array<{ type?: string; path?: string }>) : [];
      } catch {
        return [];
      }
    })();
    const marketResearchAttachments = allAttachments
      .filter((a) => a?.type === 'market_research' && typeof a.path === 'string')
      .map((a) => a.path as string);

    const input: DocumentGeneratorInput = {
      property_type: listing.property_type,
      field_visit_data,
      supplementary_data,
      market_research: {
        summary: listing.market_summary ?? null,
        attachments: marketResearchAttachments,
      },
    };

    const generator = createDefaultGenerator();

    // 若有指定 documentType，只產出該文件
    if (documentType) {
      const singleResult = await generator.generateSingle(input, documentType);

      // updateDocuments 只更新指定欄位（merge existing docs）
      let docs: Record<string, unknown> = {};
      try {
        docs = listing.generated_documents ? (JSON.parse(listing.generated_documents) as Record<string, unknown>) : {};
      } catch {
        docs = {};
      }
      docs[documentType] = singleResult;

      await updateDocuments(numId, docs);
      return NextResponse.json({ ok: true, documentType, document: singleResult });
    }

    // 否則維持原有全量產出
    const result = await generator.generate(input);
    await updateDocuments(numId, result as unknown as Record<string, unknown>);

    return NextResponse.json({
      ok: true,
      documents: result,
      downloadUrls: {
        disclosure_document: `/api/listings/${numId}/pdf`,
        documents: `/api/listings/${numId}/documents`,
      },
    });
  } catch (error: unknown) {
    console.error('文件產生失敗', error);
    const message = error instanceof Error ? error.message : String(error);
    const provider = message.includes('Codex')
      ? 'Codex'
      : message.includes('Haiku')
        ? 'Haiku'
        : message.includes('Gemini')
          ? 'Gemini'
          : 'unknown';
    return NextResponse.json({ error: 'generation-failed', provider, message }, { status: 422 });
  }
}

