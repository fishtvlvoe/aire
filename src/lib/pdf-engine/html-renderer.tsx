import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getHtmlThemeTokens } from "./html-themes";
import {
  HtmlCover,
  HtmlPageHeader,
  HtmlPageFooter,
  HtmlSection,
  HtmlFieldTable,
  HtmlSignatureBlock,
} from "./html-components";
import type { CaseDossierData } from "./document";

const REGULATIONS = [
  "一、依不動產經紀業管理條例第二十二條至二十六條規定，經紀業應於買方簽訂要約書後三十日內，向當地主管機關請領不動產說明書，並交付買方。",
  "二、本說明書為經紀業依法製作之重要文件，買賣雙方應詳閱內容，確認無誤後始得簽章。說明事項有虛偽不實或隱匿情事者，經紀業與其從業人員應負賠償責任。",
  "三、買方於簽章前，得請求出示不動產說明書，已閱讀全部內容。經紀人員不得拒絕。",
  "四、本說明書之內容如有增減或修改，應由買賣雙方及經紀人員共同簽章確認。",
];

const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Noto Serif TC", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", serif; background: #fff; }
@page { size: A4; margin: 0; }
.page { width: 210mm; min-height: 297mm; padding: 36px 40px 48px 40px; page-break-after: always; position: relative; overflow: hidden; }
@media print { .page { page-break-after: always; } }
`;

function val(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export function renderDisclosureHtml(
  data: CaseDossierData,
  options: { themeId: string; generatedAt: string }
): string {
  const tokens = getHtmlThemeTokens(options.themeId);
  const d = data as any;

  const landRows: Array<[string, string]> = [
    ["地段", val(d.landMark?.section ?? d.section)],
    ["地號", val(d.landMark?.lotNo ?? d.landLotNo)],
    ["地目", val(d.landMark?.landCategory ?? d.landCategory)],
    ["面積（㎡）", val(d.landArea)],
    ["使用分區", val(d.urbanPlanZone ?? d.zoningType)],
    ["非都市土地使用類別", val(d.nonUrbanLandCategory)],
    ["容積率", val(d.floorAreaRatio)],
    ["建蔽率", val(d.buildingCoverageRatio)],
  ];

  const rightsRows: Array<[string, string]> = [
    ["所有權人", val(data.ownerName)],
    ["權利範圍", val(d.ownershipShare ?? d.ownershipRatio ?? "全部")],
    ["他項權利種類", val(d.otherRightsDetail)],
    ["限制登記", val(d.restrictionRegistration)],
    ["信託登記", val(d.trustRegistration)],
    ["預告登記", val(d.cautionRegistration)],
  ];

  const usageRows: Array<[string, string]> = [
    ["現況使用情形", val(d.currentOccupation)],
    ["租賃情況", val(d.currentRentalStatus)],
    ["共有管理", val(d.sharedManagement)],
    ["現有道路", val(d.existingRoad)],
    ["特定目的事業用地", val(d.specialDesignatedArea)],
    ["環境影響事項", val(d.environmentalImpact)],
  ];

  const transactionRows: Array<[string, string]> = [
    ["總成交金額", val(data.transactionTotalPrice)],
    ["付款方式", val(data.paymentMethod)],
    ["稅費負擔約定", val(data.taxBurdenAgreement)],
    ["違約金約定", val(data.penaltyClause)],
    ["周邊成交行情", val(data.surroundingTransactionPrice)],
  ];

  const body = renderToStaticMarkup(
    <React.Fragment>
      {/* Page 1: Cover */}
      <div className="page">
        <HtmlCover
          tokens={tokens}
          caseNo={data.caseNo}
          address={data.address}
          propertyType={data.propertyType}
          companyName={data.companyName}
          generatedAt={options.generatedAt}
        />
      </div>

      {/* Page 2: 法規告知 */}
      <div className="page">
        <HtmlPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={2} />
        <HtmlSection tokens={tokens} title="說明（法規告知事項）">
          <ol style={{ paddingLeft: "1.2em", lineHeight: "2", fontSize: "13px" }}>
            {REGULATIONS.map((reg, i) => (
              <li key={i} style={{ marginBottom: "12px", listStyle: "none", textIndent: "-1.2em", paddingLeft: "1.2em" }}>
                {reg}
              </li>
            ))}
          </ol>
        </HtmlSection>
        <HtmlPageFooter tokens={tokens} generatedAt={options.generatedAt} />
      </div>

      {/* Page 3: 土地標示 + 權利範圍 + 使用管制 */}
      <div className="page">
        <HtmlPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={3} />
        <HtmlSection tokens={tokens} title="土地標示">
          <HtmlFieldTable tokens={tokens} rows={landRows} />
        </HtmlSection>
        <HtmlSection tokens={tokens} title="所有權及他項權利概況">
          <HtmlFieldTable tokens={tokens} rows={rightsRows} />
        </HtmlSection>
        <HtmlSection tokens={tokens} title="使用管制及現況">
          <HtmlFieldTable tokens={tokens} rows={usageRows} />
        </HtmlSection>
        <HtmlPageFooter tokens={tokens} generatedAt={options.generatedAt} />
      </div>

      {/* Page 4: 成交行情 + 簽名 */}
      <div className="page">
        <HtmlPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={4} />
        <HtmlSection tokens={tokens} title="成交行情表">
          <HtmlFieldTable tokens={tokens} rows={transactionRows} />
        </HtmlSection>
        <HtmlSignatureBlock tokens={tokens} />
        <HtmlPageFooter tokens={tokens} generatedAt={options.generatedAt} />
      </div>
    </React.Fragment>
  );

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>不動產說明書 — ${data.caseNo}</title>
<style>${BASE_CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
}
