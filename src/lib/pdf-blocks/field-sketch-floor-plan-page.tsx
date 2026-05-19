import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export const FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER =
  "本圖依現場手稿整理，供空間配置參考；實際面積、權利範圍、登記事項與法定用途，以地政謄本、權狀、主管機關資料及現場確認為準。";

export interface FieldSketchFloorPlanPageProps {
  renderedSvg: string;
  sourceLabel: string;
  approvedAt: string;
  disclaimer: string;
  originalSketchVersion: number;
  conversionId: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 72,
    fontFamily: "NotoSansTC",
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    color: "#111827",
    fontFamily: "NotoSansTC",
  },
  sourceRow: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 10,
    fontFamily: "NotoSansTC",
  },
  imageBox: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    height: 480,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    padding: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  placeholderText: {
    fontSize: 10,
    color: "#6B7280",
    fontFamily: "NotoSansTC",
  },
  disclaimer: {
    fontSize: 9,
    color: "#111827",
    lineHeight: 1.45,
    marginTop: 4,
    marginBottom: 10,
    fontFamily: "NotoSansTC",
  },
  meta: {
    fontSize: 8,
    color: "#6B7280",
    fontFamily: "NotoSansTC",
  },
});

function svgToDataUri(renderedSvg: string): string {
  const base64 = Buffer.from(renderedSvg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export default function FieldSketchFloorPlanPage({
  renderedSvg,
  sourceLabel,
  approvedAt,
  disclaimer,
  originalSketchVersion,
  conversionId,
}: FieldSketchFloorPlanPageProps): React.ReactElement {
  const dataUri = renderedSvg ? svgToDataUri(renderedSvg) : null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>格局圖（現場手稿整理）</Text>
      <Text style={styles.sourceRow}>來源：{sourceLabel}</Text>

      <View style={styles.imageBox}>
        {dataUri ? (
          <Image style={styles.image} src={dataUri} />
        ) : (
          <Text style={styles.placeholderText}>（尚無格局圖）</Text>
        )}
      </View>

      {/* IMPORTANT: disclaimer must appear as literal text in component output */}
      <Text style={styles.disclaimer}>
        本圖依現場手稿整理，供空間配置參考；實際面積、權利範圍、登記事項與法定用途，以地政謄本、權狀、主管機關資料及現場確認為準。
      </Text>

      {disclaimer && disclaimer !== FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER ? (
        <Text style={[styles.disclaimer, { color: "#6B7280", fontSize: 8 }]}>{disclaimer}</Text>
      ) : null}

      <Text style={styles.meta}>
        版本：v{originalSketchVersion}　審核通過：{approvedAt}　Conversion ID：{conversionId}
      </Text>
    </Page>
  );
}
