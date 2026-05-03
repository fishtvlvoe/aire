/**
 * 驗證 disclosure PDF 生成修正
 * - 低信心值欄位顯示為空白（______）
 * - 高信心值欄位（confidence ≥ 0.80）正常填入
 * - 封面頁碼格式為「第 X 頁 / 共 Y 頁」且數字 > 0
 * - 章節 10、12 表頭為正確中文
 */
import fs from 'fs';
import path from 'path';
import { getListing } from '../src/lib/db';
import { generateDossierPDF } from '../src/lib/pdf-generator/dossier';
import { buildDocumentInput } from '../src/lib/document-generator/build-input';

async function main() {
  const listingId = 202;
  const listing = getListing(listingId);
  if (!listing) {
    console.error(`Listing ${listingId} not found`);
    process.exit(1);
  }

  const docs = listing.generated_documents
    ? (JSON.parse(listing.generated_documents) as Record<string, unknown>)
    : {};
  const disclosureMarkdown = String(docs.disclosure_document || '');

  if (!disclosureMarkdown) {
    console.error('No disclosure document found');
    process.exit(1);
  }

  console.log(`Generating PDF for listing ${listingId}...`);

  const input = buildDocumentInput(listing);
  const pdfBytes = await generateDossierPDF(disclosureMarkdown, listingId, input);

  const outputPath = `/tmp/disclosure-${listingId}-verify.pdf`;
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ PDF saved to ${outputPath} (${pdfBytes.length} bytes)`);

  // 檢查 Markdown 內容中的關鍵驗證點
  console.log('\n--- Markdown Verification ---');

  // 1. 檢查低信心值欄位是否被過濾
  const extractedDataRaw = listing.extracted_data
    ? JSON.parse(listing.extracted_data)
    : {};
  const mergedFields = extractedDataRaw.merged_fields || {};
  console.log('\nConfidence check:');
  for (const [key, field] of Object.entries(mergedFields)) {
    const f = field as { value: unknown; confidence?: number };
    const inMarkdown = disclosureMarkdown.includes(String(f.value));
    console.log(`  ${key}: confidence=${f.confidence ?? 'N/A'}, inMarkdown=${inMarkdown}`);
  }

  // 2. 檢查頁碼相關（模板層，無法直接從 Markdown 檢查，需看 PDF）
  console.log('\nPage number: see PDF header (should be "第 X 頁 / 共 Y 頁")');

  // 3. 檢查章節 10、12 表頭
  console.log('\nSection headers:');
  const section10Match = disclosureMarkdown.match(/#### 章節 10[\s\S]*?\|.*?\|[\s\S]*?\n\|/);
  const section12Match = disclosureMarkdown.match(/#### 章節 12[\s\S]*?\|.*?\|[\s\S]*?\n\|/);
  console.log('  Section 10 table header:', section10Match ? section10Match[0].split('\n')[1] : 'NOT FOUND');
  console.log('  Section 12 table header:', section12Match ? section12Match[0].split('\n')[1] : 'NOT FOUND');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
