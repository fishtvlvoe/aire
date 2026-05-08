import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireListingAccess } from '@/lib/auth/require-listing-access';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { generateDossierPDF } from '@/lib/pdf-generator/dossier';
import {
  generateSurveySalesPDF,
  type SurveySalesTemplateId,
} from '@/lib/pdf-generator/survey-sales';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const user = await resolveCurrentUser(req);
  const access = requireListingAccess(user, numId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, code: access.code }, { status: access.status });
  }
  const listing = access.listing;
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

  // disclosure type: use dedicated dossier generator with styled template
  if (type === 'disclosure') {
    if (!content || content === '[PDF 由任務 10 實作]') {
      return NextResponse.json({ error: 'disclosure document not available' }, { status: 422 });
    }

    // 建立 DocumentGeneratorInput 供封面 header 欄位帶入
    const supplementaryData = listing.supplementary_data
      ? (JSON.parse(listing.supplementary_data) as Record<string, unknown>)
      : {};
    const dossierInput: DocumentGeneratorInput = {
      property_type: listing.property_type,
      field_visit_data: fieldVisitData,
      supplementary_data: supplementaryData,
    };

    const pdfBytes = await generateDossierPDF(content, numId, dossierInput);
    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="disclosure-${id}.pdf"`,
      },
    });
  }

  // survey / sales-dm: 使用 v31-polish 引入的專業模板
  if (type === 'survey' || type === 'sales-dm') {
    if (!content) {
      return NextResponse.json({ error: `${type} document not generated yet` }, { status: 422 });
    }
    const totalPriceRaw =
      (fieldVisitData.total_price as number | string | undefined) ??
      (listing.supplementary_data
        ? ((JSON.parse(listing.supplementary_data) as Record<string, unknown>).total_price as
            | number
            | string
            | undefined)
        : undefined);

    const pdfBytes = await generateSurveySalesPDF(type as SurveySalesTemplateId, {
      markdown: content,
      propertyName: String(fieldVisitData.property_name ?? fieldVisitData.title ?? '物件'),
      propertyAddress: address,
      caseId: String(numId),
      totalPrice: totalPriceRaw,
      agentName: String(fieldVisitData.agent_name ?? ''),
      agentPhone: String(fieldVisitData.agent_phone ?? ''),
    });

    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}-${id}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: `unsupported PDF type: ${type}` }, { status: 400 });
}
