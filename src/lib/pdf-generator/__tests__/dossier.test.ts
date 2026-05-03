import { describe, it, expect, vi } from 'vitest';
import { generateDossierPDF } from '../dossier';

// Mock puppeteer to avoid launching actual browser in tests
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setViewport: vi.fn().mockResolvedValue(undefined),
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])), // %PDF magic bytes
        evaluate: vi.fn().mockResolvedValue([]), // returns empty coord array in tests
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('property-dossier PDF generation', () => {
  it('should call generateDossierPDF with markdown content', async () => {
    const markdown = `# 農地物件調查表

## 基本資訊
- 地址：台南市東區
- 面積：100 坪

## 土壤與水源
- 土壤類型：壤土
- 水源：自來水
`;

    const result = await generateDossierPDF(markdown, 'test-123');
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate PDF for apartment listing', async () => {
    const markdown = `# 公寓物件調查表

## 基本資訊
- 地址：台北市信義區
- 單位數：10
- 樓層數：5

## 建築狀況
- 建築年齡：15 年
- 停車位：8 個
`;

    const result = await generateDossierPDF(markdown, 'apt-456');
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should return Uint8Array for any listing id', async () => {
    const markdown = `# 物件調查表

## 段落 1
內容 1
`;

    const result = await generateDossierPDF(markdown, 'test-custom');
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should handle markdown conversion', async () => {
    const markdown = `# 標題

## 副標題

段落內容

- 列點 1
- 列點 2
`;

    const result = await generateDossierPDF(markdown, 'test-markdown');
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('template 路徑解析（Decision: process.cwd()）', () => {
  /**
   * 【TDD 紅燈】
   * Decision：以 process.cwd() 取代 __dirname 來解析 PDF template 路徑。
   *
   * 原因：在 vitest 執行環境下，__dirname 常會指到編譯後/不同的路徑，
   * 導致讀不到 templates 目錄（測試會先紅燈，推動實作改用 process.cwd()）。
   */

  it('從 process.cwd() 可讀取 dossier.html 與 dossier.css 且 HTML 含 CONTENT 佔位符', async () => {
    // 不使用 mock：直接從檔案系統讀取，驗證「以 process.cwd() 決定 template 基準路徑」可行。
    const fs = await import('node:fs');
    const path = await import('node:path');

    const templateDir = path.join(process.cwd(), 'src/lib/pdf-generator/templates');
    const htmlPath = path.join(templateDir, 'dossier.html');
    const cssPath = path.join(templateDir, 'dossier.css');

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const css = fs.readFileSync(cssPath, 'utf-8');

    expect(html.length).toBeGreaterThan(100);
    expect(css.length).toBeGreaterThan(100);
    expect(html).toContain('{{CONTENT}}');
  });

  it('generateDossierPDF 回傳 Uint8Array 且前 byte 為 PDF 簽章或 mock bytes', async () => {
    // 不論是真實 PDF 或測試環境下的 mock（puppeteer.pdf 回傳 %PDF magic bytes），
    // 我們都只要求：回傳 Uint8Array 且前 4 bytes 能辨識為 PDF 簽章。
    const result = await generateDossierPDF('# 測試\n內容', 1);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThanOrEqual(4);

    const b = Array.from(result.slice(0, 4));
    const isPdfSignature = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
    const isMockBytes = b.join(',') === [0x25, 0x50, 0x44, 0x46].join(',');

    expect(isPdfSignature || isMockBytes).toBe(true);
  });
});
