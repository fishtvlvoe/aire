/**
 * PDF layout coordinate 表
 *
 * 對應 src/resources/templates/residential.pdf（成屋）與 land.pdf（土地）。
 * 每筆 { field, page, x, y, size } 描述「在哪一頁、哪個座標、什麼字體大小」畫欄位值。
 *
 * Phase 1 status：stub 階段。實際座標需要對著 19 頁底板 PDF 視覺校對。
 * 目前先給 Group 8.3 PDF 渲染器一個型別與最小集合，讓代碼能編譯通過。
 * Group 8.2 task 內由視覺校對人員（或 Fish）逐頁微調 x / y / size。
 *
 * 座標系統：pdf-lib 預設 PDF 座標原點在「左下角」，y 軸向上為正。
 * 單位：points（1pt = 1/72 inch）。A4 頁面尺寸 595×842 points。
 */

export interface PdfLayoutEntry {
  field: string;
  page: number;
  x: number;
  y: number;
  size: number;
  /** 字重，預設 'regular'。如需粗體用 'bold' */
  weight?: "regular" | "bold";
  /** 最大寬度（自動截斷）；不設則不截斷 */
  maxWidth?: number;
}

export type DisclosureLayout = readonly PdfLayoutEntry[];

/**
 * 成屋說明書 layout（19 頁底板）
 *
 * Phase 1 stub：列出主要欄位、座標待校對。
 * 真實校對方法：用 pdf-lib 開底板 → 在每頁畫紅點 → 對照空白欄位調 x / y。
 */
export const residentialLayout: DisclosureLayout = [
  // 第 0 頁（封面）— 公司資訊
  { field: "company_name", page: 0, x: 80, y: 720, size: 18, weight: "bold" },
  { field: "company_address", page: 0, x: 80, y: 690, size: 11 },
  { field: "company_phone", page: 0, x: 80, y: 670, size: 11 },

  // 第 1 頁（說明頁）— 案件編號、產出日期
  { field: "case_no", page: 1, x: 120, y: 760, size: 12 },
  { field: "generated_at", page: 1, x: 120, y: 740, size: 11 },

  // 第 2 頁（土地標示）
  { field: "land_lot_no", page: 2, x: 140, y: 700, size: 12 },
  { field: "address", page: 2, x: 140, y: 670, size: 12 },
  { field: "land_area", page: 2, x: 140, y: 640, size: 12 },

  // 第 3 頁（建物標示）
  { field: "building_lot_no", page: 3, x: 140, y: 700, size: 12 },
  { field: "floor_area", page: 3, x: 140, y: 670, size: 12 },
  { field: "building_age", page: 3, x: 140, y: 640, size: 12 },
  { field: "building_structure", page: 3, x: 140, y: 610, size: 12 },
  { field: "floor_total", page: 3, x: 140, y: 580, size: 12 },
  { field: "floor_this", page: 3, x: 140, y: 550, size: 12 },

  // 第 4 頁（他項權利）
  { field: "ownership_type", page: 4, x: 140, y: 700, size: 12 },
  { field: "mortgage_status", page: 4, x: 140, y: 670, size: 12 },
  { field: "other_rights", page: 4, x: 140, y: 640, size: 12 },

  // 第 5 頁（稅費）
  { field: "tax_land_value", page: 5, x: 140, y: 700, size: 12 },
  { field: "tax_building_value", page: 5, x: 140, y: 670, size: 12 },
  { field: "tax_property_tax_annual", page: 5, x: 140, y: 640, size: 12 },
  { field: "tax_land_value_tax_annual", page: 5, x: 140, y: 610, size: 12 },

  // 第 6 頁（成交行情，留空待 Phase 3 串行情 API）
  // 第 7-9 頁（房屋現況調查表，5 個 boolean + 文字）
  { field: "condition_leakage", page: 7, x: 380, y: 700, size: 12 },
  { field: "condition_renovation", page: 7, x: 380, y: 670, size: 12 },
  { field: "condition_illegal_addition", page: 7, x: 380, y: 640, size: 12 },
  { field: "condition_defects_notes", page: 8, x: 80, y: 700, size: 11, maxWidth: 440 },

  // 第 10 頁（附件）
  { field: "attachment_property_deed", page: 10, x: 380, y: 700, size: 12 },
  { field: "attachment_floor_plan", page: 10, x: 380, y: 670, size: 12 },
  { field: "attachment_photos_notes", page: 10, x: 80, y: 640, size: 11, maxWidth: 440 },

  // 第 11 頁（生活機能，留空待 Phase 3 串 Maps）

  // 第 12-17 頁（房屋現況調查表 5 頁，視 PDF 底板已有的勾選框留空）

  // 第 18 頁（簽章欄）
  { field: "owner_name", page: 18, x: 140, y: 200, size: 12 },
  { field: "company_name", page: 18, x: 380, y: 200, size: 12 },
];

/**
 * 土地說明書 layout（19 頁底板，跟成屋共用前 6 頁、第 11 頁與簽章頁；
 * 現況調查表那 5 頁的問題不同）
 */
export const landLayout: DisclosureLayout = [
  // 封面（共用）
  { field: "company_name", page: 0, x: 80, y: 720, size: 18, weight: "bold" },
  { field: "company_address", page: 0, x: 80, y: 690, size: 11 },
  { field: "company_phone", page: 0, x: 80, y: 670, size: 11 },

  // 說明頁（共用）
  { field: "case_no", page: 1, x: 120, y: 760, size: 12 },
  { field: "generated_at", page: 1, x: 120, y: 740, size: 11 },

  // 土地標示
  { field: "land_lot_no", page: 2, x: 140, y: 700, size: 12 },
  { field: "address", page: 2, x: 140, y: 670, size: 12 },
  { field: "land_area", page: 2, x: 140, y: 640, size: 12 },
  { field: "zoning_use", page: 2, x: 140, y: 610, size: 12 },
  { field: "urban_district", page: 2, x: 140, y: 580, size: 12 },
  { field: "land_category", page: 2, x: 140, y: 550, size: 12 },

  // 權利
  { field: "ownership_type", page: 4, x: 140, y: 700, size: 12 },
  { field: "share_ratio", page: 4, x: 140, y: 670, size: 12 },
  { field: "mortgage_status", page: 4, x: 140, y: 640, size: 12 },
  { field: "other_rights", page: 4, x: 140, y: 610, size: 12 },

  // 稅費
  { field: "tax_land_value", page: 5, x: 140, y: 700, size: 12 },
  { field: "tax_announced_present_value", page: 5, x: 140, y: 670, size: 12 },
  { field: "tax_land_value_tax_annual", page: 5, x: 140, y: 640, size: 12 },

  // 土地現況調查表（第 7-9 頁，題目不同）
  { field: "condition_access", page: 7, x: 380, y: 700, size: 12 },
  { field: "condition_boundary_clear", page: 7, x: 380, y: 670, size: 12 },
  { field: "condition_tenant_present", page: 7, x: 380, y: 640, size: 12 },
  { field: "condition_defects_notes", page: 8, x: 80, y: 700, size: 11, maxWidth: 440 },

  // 簽章
  { field: "owner_name", page: 18, x: 140, y: 200, size: 12 },
  { field: "company_name", page: 18, x: 380, y: 200, size: 12 },
];
