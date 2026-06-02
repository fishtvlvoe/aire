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

function squareMetersToPing(value: string | number | boolean): string {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return "";
  return (Math.round(numeric * 0.3025 * 100) / 100).toFixed(2);
}

function displayAskingPrice(value: string | number | boolean | undefined | null): string {
  if (value === 0 || value === "0") return BLANK;
  return val(value, (v) => Number(v).toLocaleString("zh-TW"));
}

function formatRocDateForBuyer(value: string | number | boolean): string {
  const raw = String(value).trim();
  if (!raw) return "";
  const slash = raw.match(/^(?:民國)?(\d{2,3})[年/-](\d{1,2})[月/-](\d{1,2})日?$/);
  if (slash) {
    return `民國${slash[1].padStart(3, "0")}年${slash[2].padStart(2, "0")}月${slash[3].padStart(2, "0")}日`;
  }
  const compact = raw.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (compact) {
    return `民國${compact[1]}年${compact[2]}月${compact[3]}日`;
  }
  return raw;
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
  const display = (
    value: string | number | boolean | undefined | null,
    formatter?: (v: string | number | boolean) => string,
  ) => val(value, formatter);
  const landAreaLabel = propertyType === "building" ? "基地土地總面積（坪）" : "土地面積（坪）";

  // 土地與建物共用欄位
  const commonRows: Array<[string, string]> = [
    [propertyType === "land" ? "標的描述" : "建物門牌", val(data.address)],
    ["委託總價（元）", displayAskingPrice(ps?.askingPrice)],
    ["地段", display(ps?.landSection)],
    ["地號", display(ps?.landNumber)],
    ["使用分區", display(ps?.zoning)],
    [landAreaLabel, display(ps?.landArea, squareMetersToPing)],
    ["權利範圍", display(ps?.ownershipRatio)],
    ["持分面積（坪）", display(ps?.shareArea, squareMetersToPing)],
    ["建蔽率", display(ps?.buildingCoverage)],
    ["容積率", display(ps?.floorAreaRatio)],
    ["所有權人", display(ps?.owner)],
    [propertyType === "building" ? "建築完成日" : "取得日期", display(propertyType === "building" ? ps?.constructionDate : ps?.acquisitionDate, formatRocDateForBuyer)],
  ];

  // 建物面積（坪）欄位，僅 building 顯示
  const areaRows: Array<[string, string]> = [
    ["登記坪數", display(ps?.registeredArea, (v) => Number(v).toFixed(2))],
    ["主建坪數", display(ps?.mainBuildingArea, (v) => Number(v).toFixed(2))],
    ["附屬建物", display(ps?.auxiliaryArea, (v) => Number(v).toFixed(2))],
    ["公共設施", display(ps?.commonArea, (v) => Number(v).toFixed(2))],
    ["車位坪數", display(ps?.parkingArea, (v) => Number(v).toFixed(2))],
  ];

  // 建物現況欄位，僅 building 顯示
  const conditionRows: Array<[string, string]> = [
    ["法定用途", display(ps?.legalUse)],
    ["主要建材", display(ps?.material)],
    ["建築完成日", display(ps?.constructionDate, formatRocDateForBuyer)],
    ["屋齡", display(ps?.buildingAge)],
    ["樓層", display(ps?.floor)],
    ["權利範圍", display(ps?.ownershipScope)],
    ["建物現況", display(ps?.buildingStatus)],
    ["格局", display(ps?.rooms)],
    ["座向", display(ps?.direction)],
    ["管理費（元/月）", display(ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))],
    ["電梯", ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK],
    ["建設公司", display(ps?.constructionCompany)],
    ["社區名稱", display(ps?.communityName)],
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
