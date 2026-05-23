import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import type { CaseDossierData } from "../pdf-engine/document";

const PAGE_STYLE = {
  paddingTop: 36,
  paddingBottom: 48,
  paddingHorizontal: 40,
  fontFamily: "NotoSansTC",
  fontSize: 10,
} as const;

const BLANK = "";

function val(v: string | number | boolean | undefined | null, formatter?: (v: string | number | boolean) => string): string {
  if (v === undefined || v === null || v === "") return BLANK;
  if (formatter) return formatter(v);
  return String(v);
}

function sourced(value: string, source?: string): string {
  if (!value || !source) return value;
  return `${value}（來源：${source}）`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB", paddingVertical: 5 }}>
      <Text style={{ width: "40%", color: "#6B7280", fontSize: 10 }}>{label}</Text>
      <Text style={{ width: "60%", color: "#111827", fontSize: 10 }}>{value}</Text>
    </View>
  );
}

function formatCandidateSummary(fields?: Record<string, unknown>): string {
  if (!fields) return "";
  const parts = [
    typeof fields.registeredAreaPing === "number" ? `登記 ${fields.registeredAreaPing.toFixed(2)}坪` : "",
    typeof fields.mainBuildingAreaPing === "number" ? `主建 ${fields.mainBuildingAreaPing.toFixed(2)}坪` : "",
    typeof fields.legalUse === "string" ? fields.legalUse : "",
    typeof fields.constructionDate === "string" ? fields.constructionDate : "",
    typeof fields.floor === "string" ? fields.floor : "",
  ].filter(Boolean);
  return parts.join(" / ");
}

export function PropertyDataSheetPage({
  propertyType,
  data,
}: {
  propertyType: "land" | "building";
  data: CaseDossierData;
}): React.ReactElement {
  const ps = data.propertySheet;
  const display = (
    key: string,
    value: string | number | boolean | undefined | null,
    formatter?: (v: string | number | boolean) => string,
  ) => sourced(val(value, formatter), data.propertySheetSources?.[key]);

  return (
    <Page size="A4" style={PAGE_STYLE}>
      <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#111827" }}>物件資料表</Text>

      <Row label="委託總價（元）" value={display("askingPrice", ps?.askingPrice, (v) => Number(v).toLocaleString("zh-TW"))} />
      <Row label="地段" value={display("landSection", ps?.landSection)} />
      <Row label="地號" value={display("landNumber", ps?.landNumber)} />
      <Row label="使用分區" value={display("zoning", ps?.zoning)} />
      <Row label="土地面積（㎡）" value={display("landArea", ps?.landArea, (v) => Number(v).toFixed(2))} />
      <Row label="權利範圍" value={display("ownershipRatio", ps?.ownershipRatio)} />
      <Row label="持分面積（㎡）" value={display("shareArea", ps?.shareArea, (v) => Number(v).toFixed(2))} />
      <Row label="建蔽率" value={display("buildingCoverage", ps?.buildingCoverage)} />
      <Row label="容積率" value={display("floorAreaRatio", ps?.floorAreaRatio)} />
      <Row label="所有權人" value={display("owner", ps?.owner)} />
      <Row label="取得日期" value={display("acquisitionDate", ps?.acquisitionDate)} />

      {data.preSurvey ? (
        <>
          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>
            物調表資料狀態
          </Text>
          <Row
            label="本次地政費用"
            value={data.preSurvey.lookupCost === undefined ? "待確認" : `${data.preSurvey.lookupCost.toLocaleString("zh-TW")} 元`}
          />
          {data.preSurvey.failureReasons.length > 0 ? (
            data.preSurvey.failureReasons.map((failure) => (
              <Row
                key={failure.apiId}
                label="查詢未成功"
                value={failure.reason}
              />
            ))
          ) : (
            <Row label="查詢狀態" value="無查詢失敗項目" />
          )}
          {data.preSurvey.candidateDisclaimer ? (
            <Row label="前期物調聲明" value={data.preSurvey.candidateDisclaimer} />
          ) : null}
          {data.preSurvey.inferredReference ? (
            <Row
              label="推測資料來源"
              value={`${data.preSurvey.inferredReference.source_units.join("、")}｜${data.preSurvey.inferredReference.warning}`}
            />
          ) : null}
          {data.preSurvey.candidateOptions && data.preSurvey.candidateOptions.length > 0 ? (
            <>
              <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>
                候選資料比較
              </Text>
              {data.preSurvey.candidateOptions.map((candidate) => (
                <Row
                  key={candidate.candidate_id}
                  label={candidate.normalized_parcel_id}
                  value={[
                    candidate.parcel_type === "building" ? "建物" : "土地",
                    candidate.query_status ?? "pending",
                    candidate.confirmation_state ?? "unconfirmed",
                    candidate.error_code ?? "",
                    formatCandidateSummary(candidate.summary_fields),
                  ].filter(Boolean).join("｜")}
                />
              ))}
            </>
          ) : null}
        </>
      ) : null}

      {propertyType === "building" && (
        <>
          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物面積（坪）</Text>
          <Row label="登記坪數" value={display("registeredArea", ps?.registeredArea, (v) => Number(v).toFixed(2))} />
          <Row label="主建坪數" value={display("mainBuildingArea", ps?.mainBuildingArea, (v) => Number(v).toFixed(2))} />
          <Row label="附屬建物" value={display("auxiliaryArea", ps?.auxiliaryArea, (v) => Number(v).toFixed(2))} />
          <Row label="公共設施" value={display("commonArea", ps?.commonArea, (v) => Number(v).toFixed(2))} />
          <Row label="車位坪數" value={display("parkingArea", ps?.parkingArea, (v) => Number(v).toFixed(2))} />

          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物現況</Text>
          <Row label="法定用途" value={display("legalUse", ps?.legalUse)} />
          <Row label="主要建材" value={display("material", ps?.material)} />
          <Row label="建築完成日" value={display("constructionDate", ps?.constructionDate)} />
          <Row label="屋齡" value={display("buildingAge", ps?.buildingAge)} />
          <Row label="樓層" value={display("floor", ps?.floor)} />
          <Row label="權利範圍" value={display("ownershipScope", ps?.ownershipScope)} />
          <Row label="建物現況" value={display("buildingStatus", ps?.buildingStatus)} />
          <Row label="格局" value={display("rooms", ps?.rooms)} />
          <Row label="座向" value={display("direction", ps?.direction)} />
          <Row label="管理費（元/月）" value={display("managementFee", ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))} />
          <Row label="電梯" value={ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK} />
          <Row label="建設公司" value={display("constructionCompany", ps?.constructionCompany)} />
          <Row label="社區名稱" value={display("communityName", ps?.communityName)} />
        </>
      )}
    </Page>
  );
}
