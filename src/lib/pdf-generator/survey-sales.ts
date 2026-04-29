import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

/**
 * 物調表 / 銷售 DM 的專用 PDF 模板渲染器，取代舊版 `<pre>` 直接輸出純文字的做法。
 * 與 dossier.ts 同樣使用 Puppeteer 印 HTML，但模板較輕量、欄位較少。
 */

const TEMPLATES_DIR = path.join(process.cwd(), 'src/lib/pdf-generator/templates');

export type SurveySalesTemplateId = 'survey' | 'sales-dm';

export interface SurveySalesPDFInput {
  /** 已產出的 Markdown 文件內容 */
  markdown: string;
  /** 物件名稱（顯示於頁眉與封面） */
  propertyName?: string;
  /** 物件地址 */
  propertyAddress?: string;
  /** 案件編號（顯示於封面） */
  caseId?: string;
  /** 總價（萬元，sales-dm 大字顯示）；survey 模板會忽略此欄位 */
  totalPrice?: number | string;
  /** 經紀人姓名（sales-dm 頁腳） */
  agentName?: string;
  /** 經紀人電話（sales-dm 頁腳） */
  agentPhone?: string;
}

function loadTemplate(template: SurveySalesTemplateId): { html: string; css: string } {
  const html = fs.readFileSync(path.join(TEMPLATES_DIR, `${template}.html`), 'utf-8');
  const css = fs.readFileSync(path.join(TEMPLATES_DIR, `${template}.css`), 'utf-8');
  return { html, css };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function buildFullHtml(
  template: SurveySalesTemplateId,
  templateHtml: string,
  css: string,
  contentHtml: string,
  input: SurveySalesPDFInput
): string {
  const notoFontLink =
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap">';
  let result = templateHtml.replace(
    `<link rel="stylesheet" href="${template}.css" />`,
    `${notoFontLink}\n  <style>\n${css}\n  </style>`
  );

  const today = formatDate(new Date());
  const replacements: Record<string, string> = {
    '{{LOGO_PATH}}': process.env.DOSSIER_LOGO_PATH ?? '',
    '{{COMPANY_NAME}}': process.env.COMPANY_NAME ?? '不動產仲介',
    '{{GENERATED_DATE}}': today,
    '{{PROPERTY_NAME}}': input.propertyName ?? '物件名稱',
    '{{PROPERTY_ADDRESS}}': input.propertyAddress ?? '',
    '{{CASE_ID}}': input.caseId ?? '',
    '{{TOTAL_PRICE}}': input.totalPrice == null ? '—' : String(input.totalPrice),
    '{{AGENT_NAME}}': input.agentName ?? '—',
    '{{AGENT_PHONE}}': input.agentPhone ?? '—',
    '{{CONTENT}}': contentHtml,
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

export async function generateSurveySalesPDF(
  template: SurveySalesTemplateId,
  input: SurveySalesPDFInput
): Promise<Uint8Array> {
  let contentHtml = (await marked(input.markdown ?? '')) as string;
  contentHtml = contentHtml.replace(/待補/g, '<span class="pending">待補</span>');

  const { html: templateHtml, css } = loadTemplate(template);
  const fullHtml = buildFullHtml(template, templateHtml, css, contentHtml, input);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin:
        template === 'sales-dm'
          ? { top: '12mm', bottom: '18mm', left: '10mm', right: '10mm' }
          : { top: '15mm', bottom: '20mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await browser.close();
  }
}
