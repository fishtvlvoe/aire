import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import type { DocumentGeneratorInput } from '../document-generator/types';
import { overlayAcroForm, type FieldCoordMap } from '../document-generator/pdf/acroform-overlay';

// Next.js 16 + Turbopack 下 __dirname 會解析為 /ROOT/ 假路徑（造成 ENOENT）
// 改用 process.cwd() 定位專案根目錄的 template（dev / start 皆為專案根，行為一致）
const TEMPLATES_DIR = path.join(process.cwd(), 'src/lib/pdf-generator/templates');

// A4 頁面尺寸常數（用於座標換算）
const VIEWPORT_HEIGHT = 1123; // A4 at 96 DPI（像素）
const PAGE_HEIGHT_PT = 841.89; // A4 高度（pt）
const SCALE = 72 / 96; // 像素轉 pt 比例

function loadTemplate(): { html: string; css: string } {
  const html = fs.readFileSync(path.join(TEMPLATES_DIR, 'dossier.html'), 'utf-8');
  const css = fs.readFileSync(path.join(TEMPLATES_DIR, 'dossier.css'), 'utf-8');
  return { html, css };
}

function buildFullHtml(
  contentHtml: string,
  logoPath: string,
  css: string,
  template: string,
  today: string,
  input?: DocumentGeneratorInput
): string {
  // Inline CSS: replace the external stylesheet link with a <style> block
  // so Puppeteer doesn't need to resolve relative file paths
  const notoFontLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap">';
  let result = template.replace(
    '<link rel="stylesheet" href="dossier.css" />',
    `${notoFontLink}\n  <style>\n${css}\n  </style>`
  );

  // Replace logo path (use data-URI or URL; if empty, the onerror handler hides img)
  result = result.replace('{{LOGO_PATH}}', logoPath || '');

  // Replace date
  result = result.replace('{{GENERATED_DATE}}', today);

  // 從 input 取得封面 header 欄位值
  const supplementary = (input?.supplementary_data ?? {}) as Record<string, unknown>;
  const fieldVisit = (input?.field_visit_data ?? {}) as Record<string, unknown>;
  const extracted = (input?.extracted_data ?? {}) as Record<string, unknown>;

  const propertyName = String(supplementary.property_name ?? '');
  const caseNumber = String(supplementary.case_number ?? '');
  const address =
    String(fieldVisit.address ?? extracted.address ?? '');

  // 公司名稱：supplementary_data.company_name 有值則用，否則留 pdf-blank span
  const companyNameRaw = supplementary.company_name;
  const companyNameDisplay =
    companyNameRaw && String(companyNameRaw).trim()
      ? String(companyNameRaw).trim()
      : (process.env.COMPANY_NAME ?? '');
  const companyNameCell =
    companyNameRaw && String(companyNameRaw).trim()
      ? String(companyNameRaw).trim()
      : `<span data-field-id="header-company-name" class="pdf-blank">______</span>`;

  result = result.replace('{{PROPERTY_NAME}}', propertyName || `<span data-field-id="header-property-name" class="pdf-blank">______</span>`);
  result = result.replace('{{CASE_ID}}', caseNumber || `<span data-field-id="header-case-number" class="pdf-blank">______</span>`);
  result = result.replace('{{PROPERTY_ADDRESS}}', address || `<span data-field-id="header-address" class="pdf-blank">______</span>`);
  result = result.replace('{{COMPANY_NAME_DISPLAY}}', companyNameDisplay || '不動產仲介');
  result = result.replace('{{COMPANY_NAME_CELL}}', companyNameCell);

  // Insert main content
  result = result.replace('{{CONTENT}}', contentHtml);

  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * 將 LLM 回傳的 markdown 中所有「待補」標記替換為可識別的 pdf-blank span。
 * 每個佔位符取得唯一遞增 ID，供後續 AcroForm overlay 定位使用。
 */
function replacePendingPlaceholders(html: string): string {
  let counter = 0;
  return html.replace(/待補/g, () => {
    counter++;
    return `<span data-field-id="field-${counter}" class="pdf-blank">______</span>`;
  });
}

export async function generateDossierPDF(
  markdown: string,
  listingId: number | string,
  input?: DocumentGeneratorInput
): Promise<Uint8Array> {
  // Convert Markdown to HTML and mark pending fields as fillable blanks
  let contentHtml = await marked(markdown) as string;
  contentHtml = replacePendingPlaceholders(contentHtml);

  // Load templates
  const { html: templateHtml, css } = loadTemplate();

  // LOGO_PATH: empty string until client provides the image file
  const logoPath = process.env.DOSSIER_LOGO_PATH || '';
  const today = formatDate(new Date());

  const fullHtml = buildFullHtml(contentHtml, logoPath, css, templateHtml, today, input);

  const headerTemplate = `<div style="font-size:10px;width:100%;padding:0 12mm;display:flex;justify-content:space-between;align-items:center;color:#555;">
    <span>${process.env.COMPANY_NAME || '不動產仲介'}</span>
    <span>不動產說明書</span>
    <span><span class="pageNumber"></span>/<span class="totalPages"></span></span>
  </div>`;

  const footerTemplate = `<div style="font-size:9px;width:100%;padding:0 12mm;text-align:center;color:#777;">
    製表日期：${today} | 本文件資料以謄本登記為準
  </div>`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Suppress unused variable warning — listingId reserved for future logging
  void listingId;

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // 擷取所有 [data-field-id] 元素的座標，用於後續 AcroForm overlay
    const rawCoords = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-field-id]');
      return Array.from(elements).map(el => {
        const rect = el.getBoundingClientRect();
        const fieldId = el.getAttribute('data-field-id') ?? '';
        return {
          fieldId,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      });
    });

    // 將像素座標換算為 PDF pt 座標（PDF 原點在左下角）
    const coordMap: FieldCoordMap = {};
    for (const c of rawCoords) {
      if (!c.fieldId) continue;
      const pageIndex = Math.floor(c.top / VIEWPORT_HEIGHT);
      const localTop = c.top - pageIndex * VIEWPORT_HEIGHT;
      coordMap[c.fieldId] = {
        x: c.left * SCALE,
        y: PAGE_HEIGHT_PT - (localTop + c.height) * SCALE,
        width: Math.max(c.width * SCALE, 80),   // 最小寬度 80pt
        height: Math.max(c.height * SCALE, 14), // 最小高度 14pt
        page: pageIndex,
      };
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '20mm',
        bottom: '18mm',
        left: '12mm',
        right: '12mm',
      },
    });

    // 若無可填寫欄位，直接回傳原始 PDF
    if (Object.keys(coordMap).length === 0) {
      return new Uint8Array(pdfBuffer);
    }

    // 將 AcroForm 可填寫欄位疊加到 PDF
    const pdfBytes = new Uint8Array(pdfBuffer);
    const finalPdfBytes = await overlayAcroForm(pdfBytes, coordMap);
    return finalPdfBytes;
  } finally {
    await browser.close();
  }
}
