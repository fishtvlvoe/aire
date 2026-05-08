import Handlebars from 'handlebars';
import type { Listing } from '@/lib/db';

/**
 * 將物件各階段資料合併為模板 context。
 * 優先順序（低到高）：基本欄位 < pre_commission_data < supplementary_data < field_visit_data
 */
export function assembleContext(listing: Listing): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // 基本欄位（最低優先）
  context.property_type = listing.property_type;
  context.status = listing.status;
  context.created_at = listing.created_at;
  context.updated_at = listing.updated_at;

  // pre_commission_data：委託前資料
  if (listing.pre_commission_data) {
    try {
      const data = JSON.parse(listing.pre_commission_data);
      Object.assign(context, data);
    } catch {}
  }

  // supplementary_data：補充資料（覆蓋 pre_commission）
  if (listing.supplementary_data) {
    try {
      const data = JSON.parse(listing.supplementary_data);
      Object.assign(context, data);
    } catch {}
  }

  // field_visit_data：現勘資料（最高優先）
  if (listing.field_visit_data) {
    try {
      const data = JSON.parse(listing.field_visit_data);
      Object.assign(context, data);
    } catch {}
  }

  return context;
}

/**
 * 將 Handlebars HTML 模板與 context 合併，回傳渲染後的 HTML 字串。
 * noEscape: true 讓模板可輸出 HTML 內容（由上層確保已清理）
 */
export function renderTemplate(htmlContent: string, context: Record<string, unknown>): string {
  const template = Handlebars.compile(htmlContent, { noEscape: true });
  return template(context);
}
