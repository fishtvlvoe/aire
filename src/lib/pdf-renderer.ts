/**
 * PDF 渲染器 — thin wrapper around pdf-engine
 *
 * 舊的座標表渲染實作已移除。此檔案保留向後相容的類型與簽名，
 * 內部轉派至 src/lib/pdf-engine。
 */

import { renderDisclosurePdf as engineRenderDisclosurePdf } from "./pdf-engine";
import { resolveThemeOrFallback } from "./pdf-themes/registry";
import type { CaseData } from "./pdf-engine";

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

/** 抽象載資源，方便測試 mock */
export type BinaryAssetLoader = (path: string) => Promise<ArrayBuffer>;

/**
 * 渲染說明書 PDF。回傳 Uint8Array（PDF bytes）。
 *
 * 已改為內部轉派 pdf-engine；loader / previewOnly 等舊選項暫時忽略。
 */
export async function renderDisclosurePdf(
  input: RenderInput,
  options: RenderOptions = {},
): Promise<Uint8Array> {
  // 若有 loader（測試或自訂注入），先驗證資源可載入，缺檔時丟出明確錯誤
  if (options.loader) {
    const templatePath = `/pdf-templates/${input.propertyType}.pdf`;
    try {
      await options.loader(templatePath);
    } catch (err) {
      throw new TemplateNotFoundError(templatePath);
    }

    const fontPath = "/pdf-fonts/NotoSansTC-Regular.otf";
    try {
      await options.loader(fontPath);
    } catch (err) {
      throw new FontNotFoundError(
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const caseData: CaseData = {
    caseId: input.caseInfo.case_no?.trim() || "AIRE",
    caseType: input.propertyType,
    propertyName: input.caseInfo.address || input.caseInfo.land_lot_no,
  };

  const { theme } = resolveThemeOrFallback("theme-a-minimal");
  const blob = await engineRenderDisclosurePdf(caseData, theme, null);
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
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
