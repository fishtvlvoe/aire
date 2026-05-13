import { PDFDocument, StandardFonts } from 'pdf-lib';

export type FieldCoordMap = Record<string, {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;  // 0-indexed
}>;

/**
 * 將可填寫的 AcroForm 文字欄位疊加到現有 PDF 上
 * @param pdfBytes 原始 PDF 位元組
 * @param fieldMap 欄位名稱到座標的對應表
 * @returns 加入 AcroForm 欄位後的 PDF 位元組
 */
export async function overlayAcroForm(
  pdfBytes: Uint8Array,
  fieldMap: FieldCoordMap
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  // TODO: Helvetica does not support CJK characters; users inputting Chinese in AcroForm
  // fields will see tofu (□). To fix: embed a CJK font (e.g. NotoSansTC) and call
  // field.updateAppearances(font). Tracked as a separate task.
  // 預先嵌入字型（供欄位使用）
  await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [fieldId, coord] of Object.entries(fieldMap)) {
    // 跳過頁碼超出範圍的欄位
    if (coord.page >= pages.length) {
      console.warn(`[overlayAcroForm] Skip "${fieldId}": page ${coord.page} >= ${pages.length}`);
      continue;
    }

    // 跳過尺寸無效的欄位
    if (coord.width <= 0 || coord.height <= 0) {
      console.warn(`[overlayAcroForm] Skip "${fieldId}": invalid dimensions ${coord.width}x${coord.height}`);
      continue;
    }

    const page = pages[coord.page];
    const field = form.createTextField(fieldId);

    // addToPage 必須在 setFontSize 之前執行，
    // 因為 /DA（default appearance）entry 只有在欄位加入頁面後才存在
    field.addToPage(page, {
      x: coord.x,
      y: coord.y,
      width: coord.width,
      height: coord.height,
      borderWidth: 0,
    });

    // 在欄位加入頁面後才設定 fontSize
    field.setFontSize(10);
  }

  const savedBytes = await pdfDoc.save();
  return new Uint8Array(savedBytes);
}
