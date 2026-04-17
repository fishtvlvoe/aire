import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export async function generateDossierPDF(markdown: string, listingId: number): Promise<string> {
  const outputDir = path.join(process.cwd(), 'output', String(listingId));

  // 建立輸出目錄
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'dossier.pdf');

  // 轉 Markdown 為 HTML
  const htmlContent = await marked(markdown);
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>物件調查表</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1, h2, h3 { color: #1B3A6B; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #F5F6FA; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // 用 Puppeteer 產生 PDF
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}
