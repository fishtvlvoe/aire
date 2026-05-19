/**
 * PDF 覆蓋層欄位座標表（99% zoom, scale=0.99）
 * 座標以 PDF canvas 左上角為原點（像素）
 * 初始版本只涵蓋封面頁（page 1）三個欄位
 */

export interface PdfFieldCoord {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PDF_FIELD_COORDS: Record<string, PdfFieldCoord> = {
  // 封面頁 — 物件名稱（property_name）
  property_name: { page: 1, x: 100, y: 518, w: 300, h: 22 },
  // 封面頁 — 承辦人（agent_name）
  agent_name: { page: 1, x: 100, y: 618, w: 200, h: 22 },
  // 封面頁 — 經紀人（broker_name）
  broker_name: { page: 1, x: 100, y: 645, w: 200, h: 22 },
};
