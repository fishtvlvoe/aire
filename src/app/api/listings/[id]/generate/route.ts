import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { updateDocuments } from '@/lib/db';
import { createDefaultGenerator } from '@/lib/document-generator';
import { buildDocumentInput } from '@/lib/document-generator/build-input';
import type { GeneratedDocuments } from '@/lib/document-generator/types';
import { generateSchema, validationError } from '@/lib/validation/schemas';

const statusMessages: Record<string, string> = {
  draft: '請先完成現場勘查資料（業務填寫），再回到產出頁',
  'documents-ready': '文件已產出完成',
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, numId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, code: access.code }, { status: access.status });
  }
  const listing = access.listing;

  const rawBody = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const documentType = parsed.data.documentType as keyof GeneratedDocuments | undefined;

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
    const input = buildDocumentInput(listing);
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
      return NextResponse.json({
        ok: true,
        documentType,
        document: singleResult,
        usedBackend: (singleResult as unknown as Record<string, unknown>)?.usedBackend ?? null,
      });
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
