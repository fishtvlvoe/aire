import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

// Next.js 16 + Turbopack 下 __dirname 會解析為 /ROOT/ 假路徑（造成 ENOENT）
// 改用 process.cwd() 定位專案根目錄的 template（dev / start 皆為專案根，行為一致）
const TEMPLATES_DIR = path.join(process.cwd(), 'src/lib/pdf-generator/templates');

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
  today: string
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

  // Replace date and metadata placeholders
  result = result.replace('{{GENERATED_DATE}}', today);
  result = result.replace('{{PROPERTY_NAME}}', '');
  result = result.replace('{{CASE_ID}}', '');
  result = result.replace('{{PROPERTY_ADDRESS}}', '');

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

export async function generateDossierPDF(
  markdown: string,
  listingId: number | string
): Promise<Uint8Array> {
  // Convert Markdown to HTML and mark pending fields
  let contentHtml = await marked(markdown) as string;
  contentHtml = contentHtml.replace(/待補/g, '<span class="pending">待補</span>');

  // Load templates
  const { html: templateHtml, css } = loadTemplate();

  // LOGO_PATH: empty string until client provides the image file
  const logoPath = process.env.DOSSIER_LOGO_PATH || '';
  const today = formatDate(new Date());

  const fullHtml = buildFullHtml(contentHtml, logoPath, css, templateHtml, today);

  const headerTemplate = `<div style="font-size:10px;width:100%;padding:0 12mm;display:flex;justify-content:space-between;align-items:center;color:#555;">
    <span>建安不動產</span>
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
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
