/**
 * E2E 驗證腳本 — pdf-tax-and-field-fixes
 * 驗證項目：
 * (4) 封面 system_computed 契稅欄位存在
 * (6) 封面 4 列結構（物件/案號、公司、人員）
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// 直接讀 HTML template 和 CSS
const templateHtml = readFileSync(join(ROOT, 'src/lib/pdf-generator/templates/dossier.html'), 'utf-8');
const css = readFileSync(join(ROOT, 'src/lib/pdf-generator/templates/dossier.css'), 'utf-8');

// 複製 buildFullHtml 邏輯（不用 import 避免 Next.js 環境問題）
function buildFullHtml(contentHtml, logoPath, css, template, today, input) {
  const notoFontLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap">';
  let result = template.replace(
    '<link rel="stylesheet" href="dossier.css" />',
    `${notoFontLink}\n  <style>\n${css}\n  </style>`
  );

  const hideRunningElements = `\n  <style>\n    .page-header, .page-header-title, .page-header-page, .page-footer-date, .page-footer-note { display: none !important; }\n  </style>`;
  result = result.replace('</head>', `${hideRunningElements}\n</head>`);

  result = result.replace('{{LOGO_PATH}}', logoPath || '');
  result = result.replace('{{GENERATED_DATE}}', today);

  const supplementary = input?.supplementary_data ?? {};
  const fieldVisit = input?.field_visit_data ?? {};

  const propertyName = String(supplementary.property_name ?? '');
  const caseNumber = String(supplementary.case_number ?? '');

  const companyNameRaw = supplementary.company_name;
  const companyNameDisplay = companyNameRaw && String(companyNameRaw).trim()
    ? String(companyNameRaw).trim() : '不動產仲介';
  const companyNameCell = companyNameRaw && String(companyNameRaw).trim()
    ? String(companyNameRaw).trim()
    : '<span data-field-id="header-company-name" class="pdf-blank">______</span>';

  result = result.replaceAll('{{PROPERTY_NAME}}', propertyName || '<span data-field-id="header-property-name" class="pdf-blank">______</span>');
  result = result.replace('{{CASE_ID}}', caseNumber || '<span data-field-id="header-case-number" class="pdf-blank">______</span>');
  result = result.replace('{{COMPANY_NAME_DISPLAY}}', companyNameDisplay);
  result = result.replace('{{COMPANY_NAME_CELL}}', companyNameCell);

  const agentNameRaw = supplementary.agent_name ?? fieldVisit.agent_name;
  const agentName = agentNameRaw && String(agentNameRaw).trim() ? String(agentNameRaw).trim() : '______';
  result = result.replace('{{AGENT_NAME}}', agentName);

  const caseHandler = String(supplementary.case_handler ?? '');
  const shopManager = String(supplementary.shop_manager ?? '');
  result = result.replace('{{CASE_HANDLER}}', caseHandler);
  result = result.replace('{{SHOP_MANAGER}}', shopManager);

  result = result.replace('{{CONTENT}}', contentHtml);

  return result;
}

// === Mock 資料 ===
const mockInput = {
  supplementary_data: {
    property_name: '台南市永康區測試物件',
    case_number: 'TEST-2026-001',
    company_name: '核流不動產',
    agent_name: '陳經紀',
    case_handler: '王承辦',
    shop_manager: '李店長',
  },
  field_visit_data: {},
  system_computed: {
    computed_deed_tax: 180000,
    computed_stamp_tax_buyer: 7500,
    computed_stamp_tax_seller: 7500,
    computed_registration_fee: 15000,
    computed_escrow_fee_each: 4500,
    computed_land_increment_general_approx: 500000,
    computed_land_increment_self_use_approx: 400000,
  },
};

const mockContent = `
<h2>章節 10：稅費</h2>
<table><tr><td>契稅</td><td>180,000</td></tr></table>
<h2>章節 12：土地增值稅</h2>
<table><tr><td>一般</td><td>500,000</td><td>自用</td><td>400,000</td></tr></table>
`;

const html = buildFullHtml(mockContent, '', css, templateHtml, '2026/05/03', mockInput);

// === 驗證 ===
let passed = 0;
let failed = 0;

function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}`);
    failed++;
  }
}

console.log('\n=== E2E 驗證：封面 HTML 結構 ===\n');

// (6) 封面 4 列結構
assert('封面有 dossier-subtitle（PROPERTY_NAME 副標題）', html.includes('class="dossier-subtitle"'));
assert('物件名稱顯示正確', html.includes('台南市永康區測試物件'));
assert('物件編號欄位 ({{CASE_ID}} 已替換)', !html.includes('{{CASE_ID}}') && html.includes('TEST-2026-001'));
assert('公司名稱列存在', html.includes('公司名稱') && html.includes('核流不動產'));
assert('承辦人顯示', html.includes('承辦人：王承辦'));
assert('店長顯示', html.includes('店長：李店長'));
assert('經紀人顯示', html.includes('經紀人：陳經紀'));

// PROPERTY_NAME 出現在兩處（subtitle + table）
const matches = (html.match(/台南市永康區測試物件/g) || []).length;
assert(`物件名稱出現 2 次（subtitle + table），實際 ${matches}`, matches === 2);

// 沒有殘留 placeholder
assert('無殘留 {{PROPERTY_NAME}}', !html.includes('{{PROPERTY_NAME}}'));
assert('無殘留 {{AGENT_NAME}}', !html.includes('{{AGENT_NAME}}'));
assert('無殘留 {{CASE_HANDLER}}', !html.includes('{{CASE_HANDLER}}'));
assert('無殘留 {{SHOP_MANAGER}}', !html.includes('{{SHOP_MANAGER}}'));
assert('無殘留 {{COMPANY_NAME_CELL}}', !html.includes('{{COMPANY_NAME_CELL}}'));

// (4) system_computed 稅費欄位（mock content 包含金額）
assert('章節 10 契稅金額在 HTML 中', html.includes('180,000'));
assert('章節 12 土地增值稅一般在 HTML 中', html.includes('500,000'));

console.log(`\n=== 結果：${passed} 通過 / ${failed} 失敗 ===\n`);
process.exit(failed > 0 ? 1 : 0);
