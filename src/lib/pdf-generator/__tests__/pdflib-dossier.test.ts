import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PDFParse } from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import { db } from '@/lib/db';
import { generateDossierPDFLib } from '../pdflib-dossier';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQm6qf0AAAAASUVORK5CYII=',
  'base64'
);

function ensureBackgrounds(): void {
  const dir = path.join(process.cwd(), 'public', 'branding', 'backgrounds');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'test-cover.png'), PNG_1X1);
  fs.writeFileSync(path.join(dir, 'test-content.png'), PNG_1X1);
}

function imageXObjectsPerPage(pdfDoc: PDFDocument): number[] {
  return pdfDoc.getPages().map((page) => {
    const xObject = page.node.normalizedEntries().XObject;
    return xObject.asMap().size;
  });
}

describe('generateDossierPDFLib', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM feature_flags').run();
    db.prepare('DELETE FROM listings').run();
    ensureBackgrounds();
  });

  afterEach(() => {
    const dir = path.join(process.cwd(), 'public', 'branding', 'backgrounds');
    const testFiles = ['test-cover.png', 'test-content.png'];
    for (const file of testFiles) {
      const filePath = path.join(dir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it('generates PDF bytes for Chinese markdown without puppeteer', async () => {
    db.prepare(`
      INSERT INTO listings (id, propertyType, property_type, status, generated_documents)
      VALUES (3, 'apartment', 'apartment', 'documents-ready', ?)
    `).run(JSON.stringify({ disclosure_document: '# 測試', disclosure_overrides: {} }));

    const input: DocumentGeneratorInput = {
      property_type: 'apartment',
      field_visit_data: { address: '台北市信義路三段100號' },
      supplementary_data: { property_name: '信義路三段100號', company_name: '建安不動產' },
    };

    const pdfBytes = await generateDossierPDFLib('# 標題\n\n中文內容段落', 3, input);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(500);
    expect(Array.from(pdfBytes.slice(0, 4))).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it('uses feature_flags backgrounds and field overlays without throwing', async () => {
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_cover', '/branding/backgrounds/test-cover.png');
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_content', '/branding/backgrounds/test-content.png');
    db.prepare(`
      INSERT INTO listings (id, propertyType, property_type, status, supplementary_data, generated_documents)
      VALUES (9, 'apartment', 'apartment', 'documents-ready', ?, ?)
    `).run(
      JSON.stringify({ property_name: '測試物件', company_name: '建安不動產' }),
      JSON.stringify({ disclosure_document: 'doc', disclosure_overrides: { 'object-name': '覆寫物件名稱' } })
    );

    const input: DocumentGeneratorInput = {
      property_type: 'apartment',
      field_visit_data: { address: '台北市大安區' },
      supplementary_data: { property_name: '預設物件名稱' },
    };

    const pdfBytes = await generateDossierPDFLib('## 內容\n\nLine A\nLine B', 9, input);
    expect(pdfBytes.length).toBeGreaterThan(500);

    const parser = new PDFParse({ data: Buffer.from(pdfBytes) });
    const textResult = await parser.getText();
    await parser.destroy();

    expect(textResult.text).toContain('Line A');
    const pdfText = Buffer.from(pdfBytes).toString('latin1');
    expect(pdfText).toContain('/Image');
  });

  it('applies content background to every content page when page count > 2', async () => {
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_cover', '/branding/backgrounds/test-cover.png');
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_content', '/branding/backgrounds/test-content.png');
    db.prepare(`
      INSERT INTO listings (id, propertyType, property_type, status, supplementary_data, generated_documents)
      VALUES (19, 'apartment', 'apartment', 'documents-ready', ?, ?)
    `).run(
      JSON.stringify({ property_name: '多頁測試物件', company_name: '建安不動產' }),
      JSON.stringify({ disclosure_document: 'doc', disclosure_overrides: {} })
    );

    const longParagraph = '本段落用於產生多頁 PDF。'.repeat(80);
    const markdown = `## 章節 1：重要告知\n\n${longParagraph}\n\n## 章節 2：交易資訊\n\n${longParagraph}\n\n- 第一項\n- 第二項`;

    const pdfBytes = await generateDossierPDFLib(markdown, 19, {
      property_type: 'apartment',
      field_visit_data: { address: '台北市中山區' },
      supplementary_data: { property_name: '多頁測試物件' },
    });

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    expect(pageCount).toBeGreaterThan(2);

    const pageImageCounts = imageXObjectsPerPage(pdfDoc);
    expect(pageImageCounts.length).toBe(pageCount);
    for (const imageCount of pageImageCounts) {
      expect(imageCount).toBeGreaterThan(0);
    }
  });

  it('generates clean fallback PDF without backgrounds under 200KB', async () => {
    db.prepare(`
      INSERT INTO listings (id, propertyType, property_type, status, supplementary_data, generated_documents)
      VALUES (29, 'apartment', 'apartment', 'documents-ready', ?, ?)
    `).run(
      JSON.stringify({ property_name: '無底圖測試物件', company_name: '建安不動產' }),
      JSON.stringify({ disclosure_document: 'doc', disclosure_overrides: {} })
    );

    const pdfBytes = await generateDossierPDFLib('## 章節 3：測試\n\n交易方式：買賣', 29, {
      property_type: 'apartment',
      field_visit_data: { address: '台北市松山區' },
      supplementary_data: { property_name: '無底圖測試物件' },
    });

    expect(pdfBytes.length).toBeLessThan(200 * 1024);
  });

  it('falls back to regular font when bold font is unavailable', async () => {
    db.prepare(`
      INSERT INTO listings (id, propertyType, property_type, status, generated_documents)
      VALUES (39, 'apartment', 'apartment', 'documents-ready', ?)
    `).run(JSON.stringify({ disclosure_document: 'doc', disclosure_overrides: {} }));

    const boldPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansTC-Bold.ttf');
    const backupPath = `${boldPath}.bak-test`;
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    const hadBold = fs.existsSync(boldPath);
    if (hadBold) {
      fs.renameSync(boldPath, backupPath);
    }

    try {
      const pdfBytes = await generateDossierPDFLib('## 章節 4：字體測試\n\n交易方式：買賣', 39, {
        property_type: 'apartment',
      });
      expect(pdfBytes.length).toBeGreaterThan(0);
    } finally {
      if (hadBold && fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, boldPath);
      }
    }
  });
});
