import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { overlayAcroForm, type FieldCoordMap } from '../pdf/acroform-overlay';

describe('overlayAcroForm', () => {
  it('在兩頁 PDF 上建立 2 個 AcroForm 欄位，且欄位名稱正確', async () => {
    // 建立含 2 頁的最小 PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595, 842]); // A4 page 0
    pdfDoc.addPage([595, 842]); // A4 page 1
    const inputBytes = new Uint8Array(await pdfDoc.save());

    // 定義 2 個欄位的座標對應表
    const coordMap: FieldCoordMap = {
      'field-test-1': { x: 100, y: 700, width: 150, height: 20, page: 0 },
      'field-test-2': { x: 200, y: 500, width: 120, height: 20, page: 1 },
    };

    // 執行疊加
    const resultBytes = await overlayAcroForm(inputBytes, coordMap);

    // 驗證結果 PDF 含有 2 個欄位，且名稱正確
    const resultDoc = await PDFDocument.load(resultBytes);
    const form = resultDoc.getForm();
    const fields = form.getFields();

    expect(fields).toHaveLength(2);

    const names = fields.map(f => f.getName());
    expect(names).toContain('field-test-1');
    expect(names).toContain('field-test-2');
  });

  it('跳過頁碼超出範圍的欄位', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595, 842]); // 只有 page 0
    const inputBytes = new Uint8Array(await pdfDoc.save());

    const coordMap: FieldCoordMap = {
      'field-valid': { x: 100, y: 700, width: 150, height: 20, page: 0 },
      'field-out-of-range': { x: 100, y: 700, width: 150, height: 20, page: 5 },
    };

    const resultBytes = await overlayAcroForm(inputBytes, coordMap);

    const resultDoc = await PDFDocument.load(resultBytes);
    const form = resultDoc.getForm();
    const fields = form.getFields();

    // 只有頁碼有效的欄位被加入
    expect(fields).toHaveLength(1);
    expect(fields[0].getName()).toBe('field-valid');
  });
});
