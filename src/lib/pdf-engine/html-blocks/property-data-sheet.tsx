import React from "react";
import type { CaseDossierData } from "../document";
import type { HtmlThemeTokens } from "../html-themes";
import { HtmlFieldTable, HtmlSection } from "../html-components";

// 空白佔位符，與 PDF 版本一致
const BLANK = "";

/** 將值格式化為字串，無值時回傳佔位符 */
function val(
  v: string | number | boolean | undefined | null,
  formatter?: (v: string | number | boolean) => string
): string {
  if (v === undefined || v === null || v === "") return BLANK;
  if (formatter) return formatter(v);
  return String(v);
}

export interface HtmlPropertyDataSheetProps {
  propertyType: "land" | "building";
  data: CaseDossierData;
  tokens: HtmlThemeTokens;
}

export function HtmlPropertyDataSheet({
  propertyType,
  data,
  tokens,
}: HtmlPropertyDataSheetProps): React.ReactElement {
  const ps = data.propertySheet;

  // 土地與建物共用欄位
  const commonRows: Array<[string, string]> = [
    ["委託總價（元）", val(ps?.askingPrice, (v) => Number(v).toLocaleString("zh-TW"))],
    ["地段", val(ps?.landSection)],
    ["地號", val(ps?.landNumber)],
    ["使用分區", val(ps?.zoning)],
    ["土地面積（㎡）", val(ps?.landArea, (v) => Number(v).toFixed(2))],
    ["權利範圍", val(ps?.ownershipRatio)],
    ["持分面積（㎡）", val(ps?.shareArea, (v) => Number(v).toFixed(2))],
    ["建蔽率", val(ps?.buildingCoverage)],
    ["容積率", val(ps?.floorAreaRatio)],
    ["所有權人", val(ps?.owner)],
    ["取得日期", val(ps?.acquisitionDate)],
  ];

  // 建物面積（坪）欄位，僅 building 顯示
  const areaRows: Array<[string, string]> = [
    ["登記坪數", val(ps?.registeredArea, (v) => Number(v).toFixed(2))],
    ["主建坪數", val(ps?.mainBuildingArea, (v) => Number(v).toFixed(2))],
    ["附屬建物", val(ps?.auxiliaryArea, (v) => Number(v).toFixed(2))],
    ["公共設施", val(ps?.commonArea, (v) => Number(v).toFixed(2))],
    ["車位坪數", val(ps?.parkingArea, (v) => Number(v).toFixed(2))],
  ];

  // 建物現況欄位，僅 building 顯示
  const conditionRows: Array<[string, string]> = [
    ["樓層", val(ps?.floor)],
    ["格局", val(ps?.rooms)],
    ["座向", val(ps?.direction)],
    ["管理費（元/月）", val(ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))],
    ["電梯", ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK],
    ["建設公司", val(ps?.constructionCompany)],
    ["社區名稱", val(ps?.communityName)],
  ];

  return (
    <div
      style={{
        paddingTop: 36,
        paddingBottom: 48,
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: tokens.fontFamily,
        fontSize: 10,
        backgroundColor: tokens.bg,
        color: tokens.text,
      }}
    >
      {/* 頁面標題 */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 14,
          color: tokens.text,
          margin: "0 0 14px 0",
        }}
      >
        物件資料表
      </p>

      {/* 共用基本資料表格 */}
      <HtmlFieldTable tokens={tokens} rows={commonRows} />

      {/* 建物專屬區塊 */}
      {propertyType === "building" && (
        <>
          <HtmlSection tokens={tokens} title="建物面積（坪）">
            <HtmlFieldTable tokens={tokens} rows={areaRows} />
          </HtmlSection>

          <HtmlSection tokens={tokens} title="建物現況">
            <HtmlFieldTable tokens={tokens} rows={conditionRows} />
          </HtmlSection>
        </>
      )}
    </div>
  );
}
