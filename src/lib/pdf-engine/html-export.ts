export class PdfExportError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PdfExportError';
  }
}

export async function exportPdfFromHtml(html: string, outputPath: string): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    window.print();
    return;
  }

  let browser: any;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();
    browser = null;

    try {
      const fs = await import('fs');
      fs.writeFileSync(outputPath, pdfBuffer);
    } catch (err: any) {
      if (err?.code === 'ENOSPC') {
        throw new PdfExportError('DISK_FULL', 'Disk is full, cannot write PDF to ' + outputPath);
      }
      throw new PdfExportError('EXPORT_FAILED', err?.message ?? String(err));
    }
  } catch (err: any) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    if (err instanceof PdfExportError) {
      throw err;
    }
    if (
      err?.code === 'MODULE_NOT_FOUND' ||
      err?.message?.includes('Cannot find module') ||
      err?.message?.includes('playwright')
    ) {
      throw new PdfExportError('BROWSER_NOT_FOUND', 'Playwright is not installed. Run: npm install playwright');
    }
    throw new PdfExportError('EXPORT_FAILED', err?.message ?? String(err));
  }
}
