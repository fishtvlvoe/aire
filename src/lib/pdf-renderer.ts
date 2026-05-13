/**
 * PDF 渲染器 — Group 8.3 完整實作
 *
 * - pdf-lib 載入 19 頁底板 PDF
 * - @pdf-lib/fontkit 嵌入 Noto Sans TC 子集化字型（中文支援）
 * - 按 src/lib/pdf-layout.ts 座標表 drawText 把表單資料疊上去
 * - 輸出 Uint8Array 給 Tauri IPC 寫檔
 *
 * 缺檔策略（spec 要求 graceful failure）：
 * - 底板 PDF 不存在 → throw TemplateNotFoundError（IPC 對應錯誤碼 TEMPLATE_MISSING）
 * - 字型不存在 → throw FontNotFoundError（IPC 對應錯誤碼 FONT_LOAD_FAILED）
 */

import { PDFDocument, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import type { DisclosureLayout } from "./pdf-layout";
import { residentialLayout, landLayout } from "./pdf-layout";

export interface RenderInput {
  propertyType: "residential" | "land";
  caseInfo: {
    case_no?: string;
    land_lot_no: string;
    address: string;
    owner_name?: string;
    generated_at: string;
  };
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  payload: Record<string, unknown>;
}

export interface RenderOptions {
  previewOnly?: boolean;
  loader?: BinaryAssetLoader;
}

/** 底板 PDF 找不到 */
export class TemplateNotFoundError extends Error {
  code = "TEMPLATE_MISSING" as const;
  constructor(path: string) {
    super(`找不到 PDF 底板：${path}`);
    this.name = "TemplateNotFoundError";
  }
}

/** 字型載入失敗（缺檔或損毀） */
export class FontNotFoundError extends Error {
  code = "FONT_LOAD_FAILED" as const;
  constructor(detail: string) {
    super(`字型載入失敗：${detail}`);
    this.name = "FontNotFoundError";
  }
}

/** 保留向後相容；新代碼不再使用 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

const TEMPLATE_PATHS: Record<RenderInput["propertyType"], string> = {
  residential: "/resources/templates/residential.pdf",
  land: "/resources/templates/land.pdf",
};

const FONT_PATH = "/resources/fonts/NotoSansTC-Subset.ttf";

/** 抽象載資源，方便測試 mock */
export type BinaryAssetLoader = (path: string) => Promise<ArrayBuffer>;

class AssetFetchError extends Error {
  constructor(
    public path: string,
    public status: number,
  ) {
    super(`asset fetch failed: ${path} (${status})`);
    this.name = "AssetFetchError";
  }
}

const defaultLoader: BinaryAssetLoader = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new AssetFetchError(path, res.status);
  return res.arrayBuffer();
};

/**
 * 渲染說明書 PDF。回傳 Uint8Array（PDF bytes）。
 */
export async function renderDisclosurePdf(
  input: RenderInput,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  const loader = options.loader ?? defaultLoader;

  // 1. 載底板
  const templatePath = TEMPLATE_PATHS[input.propertyType];
  let templateBytes: ArrayBuffer;
  try {
    templateBytes = await loader(templatePath);
  } catch (err) {
    if (err instanceof AssetFetchError) {
      throw new TemplateNotFoundError(err.path);
    }
    throw new TemplateNotFoundError(templatePath);
  }

  // 2. 載字型
  let fontBytes: ArrayBuffer;
  try {
    fontBytes = await loader(FONT_PATH);
  } catch (err) {
    const detail = err instanceof AssetFetchError ? err.path : String(err);
    throw new FontNotFoundError(detail);
  }

  // 3. pdf-lib doc + fontkit + embedFont
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  let font: PDFFont;
  try {
    font = await pdfDoc.embedFont(fontBytes, { subset: false });
  } catch (err) {
    throw new FontNotFoundError(
      `pdf-lib embedFont 失敗：${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 4. 選 layout 並 drawText
  const layout: DisclosureLayout =
    input.propertyType === "residential" ? residentialLayout : landLayout;

  const pages = pdfDoc.getPages();

  for (const entry of layout) {
    const page = pages[entry.page];
    if (!page) continue;
    const raw = resolveFieldValue(input, entry.field);
    if (raw == null || raw === "") continue;
    const text = formatValue(raw);
    try {
      page.drawText(text, {
        x: entry.x,
        y: entry.y,
        size: entry.size,
        font,
        ...(entry.maxWidth ? { maxWidth: entry.maxWidth } : {}),
      });
    } catch (err) {
      console.warn(
        `[pdf-renderer] drawText failed at page=${entry.page} field=${entry.field}:`,
        err,
      );
    }

    if (options.previewOnly && entry.page > 0) break;
  }

  return pdfDoc.save();
}

/** caseInfo > company > payload */
function resolveFieldValue(input: RenderInput, field: string): unknown {
  const caseInfo = input.caseInfo as Record<string, unknown>;
  if (field in caseInfo) return caseInfo[field];

  if (field === "company_name") return input.company.name;
  if (field === "company_address") return input.company.address;
  if (field === "company_phone") return input.company.phone;

  if (field in input.payload) return input.payload[field];

  return null;
}

/** tri-state / number / Date / ISO 字串都轉成可印字串 */
function formatValue(v: unknown): string {
  if (v === "true") return "是";
  if (v === "false") return "否";
  if (v === "unknown") return "未知";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const ts = Date.parse(v);
      if (!Number.isNaN(ts)) {
        return new Date(ts).toLocaleString("zh-TW", {
          timeZone: "Asia/Taipei",
          hour12: false,
        });
      }
    }
    return v;
  }
  return String(v);
}

/**
 * 生成預設輸出檔名。
 * 格式：<case_no_or_AIRE>_<property_type>_<YYYYMMDD>.pdf
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
