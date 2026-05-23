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

function sourced(value: string, source?: string): string {
  if (!value || !source) return value;
  return `${value}（來源：${source}）`;
}

function formatCandidateSummary(fields?: Record<string, unknown>): string {
  if (!fields) return "";
  return [
    typeof fields.registeredAreaPing === "number" ? `登記 ${fields.registeredAreaPing.toFixed(2)}坪` : "",
    typeof fields.mainBuildingAreaPing === "number" ? `主建 ${fields.mainBuildingAreaPing.toFixed(2)}坪` : "",
    typeof fields.auxiliaryAreaPing === "number" ? `附屬 ${fields.auxiliaryAreaPing.toFixed(2)}坪` : "",
    typeof fields.commonAreaPing === "number" ? `共有 ${fields.commonAreaPing.toFixed(2)}坪` : "",
    typeof fields.parkingAreaPing === "number" ? `車位 ${fields.parkingAreaPing.toFixed(2)}坪` : "",
    typeof fields.legalUse === "string" ? fields.legalUse : "",
    typeof fields.material === "string" ? fields.material : "",
    typeof fields.constructionDate === "string" ? fields.constructionDate : "",
    typeof fields.floor === "string" ? fields.floor : "",
    typeof fields.ownershipScope === "string" ? `權利 ${fields.ownershipScope}` : "",
  ].filter(Boolean).join(" / ");
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
    key: string,
    value: string | number | boolean | undefined | null,
    formatter?: (v: string | number | boolean) => string,
  ) => sourced(val(value, formatter), data.propertySheetSources?.[key]);

  // 土地與建物共用欄位
  const commonRows: Array<[string, string]> = [
    ["委託總價（元）", display("askingPrice", ps?.askingPrice, (v) => Number(v).toLocaleString("zh-TW"))],
    ["地段", display("landSection", ps?.landSection)],
    ["地號", display("landNumber", ps?.landNumber)],
    ["使用分區", display("zoning", ps?.zoning)],
    ["土地面積（㎡）", display("landArea", ps?.landArea, (v) => Number(v).toFixed(2))],
    ["權利範圍", display("ownershipRatio", ps?.ownershipRatio)],
    ["持分面積（㎡）", display("shareArea", ps?.shareArea, (v) => Number(v).toFixed(2))],
    ["建蔽率", display("buildingCoverage", ps?.buildingCoverage)],
    ["容積率", display("floorAreaRatio", ps?.floorAreaRatio)],
    ["所有權人", display("owner", ps?.owner)],
    ["取得日期", display("acquisitionDate", ps?.acquisitionDate)],
  ];

  // 建物面積（坪）欄位，僅 building 顯示
  const areaRows: Array<[string, string]> = [
    ["登記坪數", display("registeredArea", ps?.registeredArea, (v) => Number(v).toFixed(2))],
    ["主建坪數", display("mainBuildingArea", ps?.mainBuildingArea, (v) => Number(v).toFixed(2))],
    ["附屬建物", display("auxiliaryArea", ps?.auxiliaryArea, (v) => Number(v).toFixed(2))],
    ["公共設施", display("commonArea", ps?.commonArea, (v) => Number(v).toFixed(2))],
    ["車位坪數", display("parkingArea", ps?.parkingArea, (v) => Number(v).toFixed(2))],
  ];

  // 建物現況欄位，僅 building 顯示
  const conditionRows: Array<[string, string]> = [
    ["法定用途", display("legalUse", ps?.legalUse)],
    ["主要建材", display("material", ps?.material)],
    ["建築完成日", display("constructionDate", ps?.constructionDate)],
    ["屋齡", display("buildingAge", ps?.buildingAge)],
    ["樓層", display("floor", ps?.floor)],
    ["權利範圍", display("ownershipScope", ps?.ownershipScope)],
    ["建物現況", display("buildingStatus", ps?.buildingStatus)],
    ["格局", display("rooms", ps?.rooms)],
    ["座向", display("direction", ps?.direction)],
    ["管理費（元/月）", display("managementFee", ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))],
    ["電梯", ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK],
    ["建設公司", display("constructionCompany", ps?.constructionCompany)],
    ["社區名稱", display("communityName", ps?.communityName)],
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

      {data.preSurvey?.candidateDisclaimer ? (
        <HtmlSection tokens={tokens} title="前期物調聲明">
          <p>{data.preSurvey.candidateDisclaimer}</p>
        </HtmlSection>
      ) : null}

      {data.preSurvey?.inferredReference ? (
        <HtmlSection tokens={tokens} title="推測資料來源">
          <p>
            {data.preSurvey.inferredReference.source_units.join("、")}｜
            {data.preSurvey.inferredReference.warning}
          </p>
        </HtmlSection>
      ) : null}

      {data.preSurvey?.candidateOptions && data.preSurvey.candidateOptions.length > 0 ? (
        <HtmlSection tokens={tokens} title="候選資料比較">
          <HtmlFieldTable
            tokens={tokens}
            rows={data.preSurvey.candidateOptions.map((candidate) => [
              candidate.normalized_parcel_id,
              [
                candidate.parcel_type === "building" ? "建物" : "土地",
                candidate.query_status ?? "pending",
                candidate.confirmation_state ?? "unconfirmed",
                candidate.error_code ?? "",
                formatCandidateSummary(candidate.summary_fields),
              ].filter(Boolean).join("｜"),
            ])}
          />
        </HtmlSection>
      ) : null}

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
