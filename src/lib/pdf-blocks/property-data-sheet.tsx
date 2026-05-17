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

const BLANK = "________________";

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

export function PropertyDataSheetPage({
  propertyType,
  data,
}: {
  propertyType: "land" | "building";
  data: CaseDossierData;
}): React.ReactElement {
  const ps = data.propertySheet;

  return (
    <Page size="A4" style={PAGE_STYLE}>
      <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#111827" }}>物件資料表</Text>

      <Row label="委託總價（元）" value={val(ps?.askingPrice, (v) => Number(v).toLocaleString("zh-TW"))} />
      <Row label="地段" value={val(ps?.landSection)} />
      <Row label="地號" value={val(ps?.landNumber)} />
      <Row label="使用分區" value={val(ps?.zoning)} />
      <Row label="土地面積（㎡）" value={val(ps?.landArea, (v) => Number(v).toFixed(2))} />
      <Row label="權利範圍" value={val(ps?.ownershipRatio)} />
      <Row label="持分面積（㎡）" value={val(ps?.shareArea, (v) => Number(v).toFixed(2))} />
      <Row label="建蔽率" value={val(ps?.buildingCoverage)} />
      <Row label="容積率" value={val(ps?.floorAreaRatio)} />
      <Row label="所有權人" value={val(ps?.owner)} />
      <Row label="取得日期" value={val(ps?.acquisitionDate)} />

      {propertyType === "building" && (
        <>
          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物面積（坪）</Text>
          <Row label="登記坪數" value={val(ps?.registeredArea, (v) => Number(v).toFixed(2))} />
          <Row label="主建坪數" value={val(ps?.mainBuildingArea, (v) => Number(v).toFixed(2))} />
          <Row label="附屬建物" value={val(ps?.auxiliaryArea, (v) => Number(v).toFixed(2))} />
          <Row label="公共設施" value={val(ps?.commonArea, (v) => Number(v).toFixed(2))} />
          <Row label="車位坪數" value={val(ps?.parkingArea, (v) => Number(v).toFixed(2))} />

          <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#111827" }}>建物現況</Text>
          <Row label="樓層" value={val(ps?.floor)} />
          <Row label="格局" value={val(ps?.rooms)} />
          <Row label="座向" value={val(ps?.direction)} />
          <Row label="管理費（元/月）" value={val(ps?.managementFee, (v) => Number(v).toLocaleString("zh-TW"))} />
          <Row label="電梯" value={ps?.hasElevator === true ? "有" : ps?.hasElevator === false ? "無" : BLANK} />
          <Row label="建設公司" value={val(ps?.constructionCompany)} />
          <Row label="社區名稱" value={val(ps?.communityName)} />
        </>
      )}
    </Page>
  );
}
