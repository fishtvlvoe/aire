import { describe, it, expect, vi } from 'vitest';
import { generateDossierPDF } from '../dossier';

// Mock puppeteer to avoid launching actual browser in tests
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])), // %PDF magic bytes
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
