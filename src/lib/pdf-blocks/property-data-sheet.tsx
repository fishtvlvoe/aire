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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB", paddingVertical: 5 }}>
      <Text style={{ width: "40%", color: "#6B7280", fontSize: 10 }}>{label}</Text>
      <Text style={{ width: "60%", color: "#111827", fontSize: 10 }}>{value}</Text>
    </View>
  );
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

export function PropertyDataSheetPage({
  propertyType,
  data,
}: {
  propertyType: "land" | "building";
  data: CaseDossierData;
}): React.ReactElement {
  const ps = data.propertySheet;
  const display = (
    value: string | number | boolean | undefined | null,
    formatter?: (v: string | number | boolean) => string,
  ) => val(value, formatter);
  const landAreaLabel = propertyType === "building" ? "基地土地總面積（坪）" : "土地面積（坪）";

  return (
    <Page size="A4" style={PAGE_STYLE}>
      <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#111827" }}>物件資料表</Text>

      <Row label={propertyType === "land" ? "標的描述" : "建物門牌"} value={val(data.address)} />
      <Row label="委託總價（元）" value={displayAskingPrice(ps?.askingPrice)} />
      <Row label="地段" value={display(ps?.landSection)} />
      <Row label="地號" value={display(ps?.landNumber)} />
      <Row label="使用分區" value={display(ps?.zoning)} />
      <Row label={landAreaLabel} value={display(ps?.landArea, squareMetersToPing)} />
      <Row label="權利範圍" value={display(ps?.ownershipRatio)} />
      <Row label="持分面積（坪）" value={display(ps?.shareArea, squareMetersToPing)} />
      <Row label="建蔽率" value={display(ps?.buildingCoverage)} />
      <Row label="容積率" value={display(ps?.floorAreaRatio)} />
      <Row label="所有權人" value={display(ps?.owner)} />
      <Row label={propertyType === "building" ? "建築完成日" : "取得日期"} value={display(propertyType === "building" ? ps?.constructionDate : ps?.acquisitionDate, formatRocDateForBuyer)} />

      {propertyType === "building" && (
        <>
          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物面積（坪）</Text>
          <Row label="登記坪數" value={display(ps?.registeredArea, (v) => Number(v).toFixed(2))} />
          <Row label="主建坪數" value={display(ps?.mainBuildingArea, (v) => Number(v).toFixed(2))} />
          <Row label="附屬建物" value={display(ps?.auxiliaryArea, (v) => Number(v).toFixed(2))} />
          <Row label="公共設施" value={display(ps?.commonArea, (v) => Number(v).toFixed(2))} />
          <Row label="車位坪數" value={display(ps?.parkingArea, (v) => Number(v).toFixed(2))} />

          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物現況</Text>
          <Row label="法定用途" value={display(ps?.legalUse)} />
          <Row label="主要建材" value={display(ps?.material)} />
          <Row label="建築完成日" value={display(ps?.constructionDate, formatRocDateForBuyer)} />
          <Row label="屋齡" value={display(ps?.buildingAge)} />
          <Row label="樓層" value={display(ps?.floor)} />
          <Row label="權利範圍" value={display(ps?.ownershipScope)} />
          <Row label="建物現況" value={display(ps?.buildingStatus)} />
          <Row label="格局" value={display(ps?.rooms)} />
          <Row label="座向" value={display(ps?.direction)} />
          <Row label="管理費（元/月）" value={display(ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))} />
          <Row label="電梯" value={ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK} />
          <Row label="建設公司" value={display(ps?.constructionCompany)} />
          <Row label="社區名稱" value={display(ps?.communityName)} />
        </>
      )}
    </Page>
  );
}
