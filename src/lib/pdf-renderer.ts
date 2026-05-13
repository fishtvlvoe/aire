/**
 * PDF 渲染器 — Phase 1 stub
 *
 * 對應 AIRE Phase 1 Group 8.3 — 用 pdf-lib 載入既有 19 頁底板 PDF、
 * 套字型、按 src/lib/pdf-layout.ts 座標表 drawText 把表單資料疊上去、
 * 輸出 Uint8Array 給 Tauri IPC 寫檔。
 *
 * Phase 1：明文 PDF（不加密）。Phase 2 才加密。
 *
 * 依賴：`pnpm add pdf-lib @pdf-lib/fontkit`
 *
 * 真實使用前置：
 * 1. 把 19 頁底板 PDF 放到 src/resources/templates/residential.pdf 與 land.pdf
 * 2. 跑 scripts/subset-font.py 產出 src/resources/fonts/NotoSansTC-Subset.ttf
 * 3. 視覺校對 src/lib/pdf-layout.ts 的座標
 */

import type { DisclosureLayout } from "./pdf-layout";
import { residentialLayout, landLayout } from "./pdf-layout";

export interface RenderInput {
  /** 案件屬性 */
  propertyType: "residential" | "land";
  /** 案件 header 資料 */
  caseInfo: {
    case_no?: string;
    land_lot_no: string;
    address: string;
    owner_name?: string;
    generated_at: string; // ISO 字串，呈現時轉 Asia/Taipei
  };
  /** 公司資訊（從 settings 帶入） */
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  /** 表單欄位 payload（residential / land schema） */
  payload: Record<string, unknown>;
}

export interface RenderOptions {
  /** 預覽模式：只渲染封面快速回傳。預設 false（完整 19 頁） */
  previewOnly?: boolean;
}

/**
 * 渲染說明書 PDF。
 * 回傳 Uint8Array（PDF bytes），可用 Tauri IPC 寫到使用者選的路徑。
 *
 * Phase 1 stub：實際 pdf-lib + fontkit 整合要等 Group 8.4 IPC + Group 8 子代理跑完。
 * 目前 throw 一個明確 NotImplementedError，避免靜默失敗。
 */
export async function renderDisclosurePdf(
  input: RenderInput,
  _options: RenderOptions = {},
): Promise<Uint8Array> {
  // 選 layout
  const layout: DisclosureLayout =
    input.propertyType === "residential" ? residentialLayout : landLayout;

  // 載入底板 PDF
  // const templateBytes = await fetch(
  //   `/resources/templates/${input.propertyType}.pdf`,
  // ).then((r) => r.arrayBuffer());
  // const pdfDoc = await PDFDocument.load(templateBytes);

  // 載入字型
  // const fontBytes = await fetch("/resources/fonts/NotoSansTC-Subset.ttf").then(
  //   (r) => r.arrayBuffer(),
  // );
  // pdfDoc.registerFontkit(fontkit);
  // const font = await pdfDoc.embedFont(fontBytes);

  // 逐筆 layout 畫 text
  // const pages = pdfDoc.getPages();
  // for (const entry of layout) {
  //   const page = pages[entry.page];
  //   if (!page) continue;
  //   const value = resolveFieldValue(input, entry.field);
  //   if (value == null || value === "") continue;
  //   page.drawText(String(value), {
  //     x: entry.x,
  //     y: entry.y,
  //     size: entry.size,
  //     font,
  //   });
  // }

  // return pdfDoc.save();

  throw new NotImplementedError(
    `renderDisclosurePdf: Phase 1 stub。layout 有 ${layout.length} 筆，需 pdf-lib 整合完成才能渲染。請在 Group 8.3 subagent 任務完成後再呼叫。`,
  );
}

/**
 * 從 RenderInput 解析欄位值。
 * 優先順序：caseInfo > company > payload
 */
function resolveFieldValue(input: RenderInput, field: string): unknown {
  const caseInfo = input.caseInfo as Record<string, unknown>;
  if (field in caseInfo) return caseInfo[field];

  if (field === "company_name") return input.company.name;
  if (field === "company_address") return input.company.address;
  if (field === "company_phone") return input.company.phone;

  if (field in input.payload) return input.payload[field];

  return null;
}

/**
 * Phase 1 階段性錯誤型別，明確標示「實作未完成」而非「無法執行」。
 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

/**
 * 生成預設輸出檔名。
 * 格式：<case_no_or_id>_<property_type>_<YYYYMMDD>.pdf
 */
export function generatePdfFileName(input: RenderInput): string {
  const date = new Date(input.caseInfo.generated_at);
  const taipei = new Intl.DateTimeFormat("zh-TW-u-ca-gregory", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\D/g, "");
  const prefix = input.caseInfo.case_no?.trim() || "AIRE";
  return `${prefix}_${input.propertyType}_${taipei}.pdf`;
}
