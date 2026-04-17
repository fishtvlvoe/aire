import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const TEMPLATES_DIR = path.join(__dirname, 'templates');

function loadTemplate(): { html: string; css: string } {
  const html = fs.readFileSync(path.join(TEMPLATES_DIR, 'dossier.html'), 'utf-8');
  const css = fs.readFileSync(path.join(TEMPLATES_DIR, 'dossier.css'), 'utf-8');
  return { html, css };
}

function buildFullHtml(contentHtml: string, logoPath: string, css: string, template: string): string {
  // Replace {{STYLES}} with actual CSS
  let result = template.replace('{{STYLES}}', css);

  // Handle logo — if no path, remove the logo block entirely
  if (logoPath) {
    result = result.replace('{{#if LOGO_PATH}}', '').replace('{{/if}}', '');
    result = result.replace('{{LOGO_PATH}}', logoPath);
  } else {
    // Remove the conditional logo block
    result = result.replace(/\{\{#if LOGO_PATH\}\}[\s\S]*?\{\{\/if\}\}/m, '');
  }

  // Insert content
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
  listingId: number | string,
  customOutputDir?: string
): Promise<string> {
  const outputDir = customOutputDir || path.join(process.cwd(), 'output', String(listingId));

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'dossier.pdf');

  // Convert Markdown to HTML and mark pending fields
  let contentHtml = await marked(markdown) as string;
  contentHtml = contentHtml.replace(/待補/g, '<span class="pending">待補</span>');

  // Load templates
  const { html: templateHtml, css } = loadTemplate();

  // LOGO_PATH: empty string until client provides the image file
  const logoPath = process.env.DOSSIER_LOGO_PATH || '';

  const fullHtml = buildFullHtml(contentHtml, logoPath, css, templateHtml);

  const today = formatDate(new Date());

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
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
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
  } finally {
    await browser.close();
  }

  return outputPath;
}
