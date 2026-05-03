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

  // 預先嵌入字型（供欄位使用）
  await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [fieldId, coord] of Object.entries(fieldMap)) {
    // 跳過頁碼超出範圍的欄位
    if (coord.page >= pages.length) continue;

    const page = pages[coord.page];
    const field = form.createTextField(fieldId);

    // fontSize 需透過 setFontSize 獨立設定（不在 addToPage options 中）
    field.setFontSize(10);

    field.addToPage(page, {
      x: coord.x,
      y: coord.y,
      width: coord.width,
      height: coord.height,
      borderWidth: 0,
    });
  }

  const savedBytes = await pdfDoc.save();
  return new Uint8Array(savedBytes);
}
