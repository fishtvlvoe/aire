import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────────────────────
// 樣式
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "NotoSansTC",
    fontSize: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1a1a1a",
    borderBottom: "1.5pt solid #1a1a1a",
    paddingBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  block: {
    width: "47%",
    border: "0.8pt solid #555",
    padding: "10 12",
    minHeight: 140,
  },
  blockWide: {
    width: "47%",
    border: "0.8pt solid #555",
    padding: "10 12",
    minHeight: 140,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottom: "0.5pt solid #aaa",
    paddingBottom: 4,
    color: "#1a1a1a",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 8,
    color: "#555",
    width: 64,
    flexShrink: 0,
  },
  fieldLine: {
    flex: 1,
    borderBottom: "0.6pt solid #333",
    minHeight: 14,
  },
  note: {
    fontSize: 7.5,
    color: "#888",
    marginTop: 12,
    lineHeight: 1.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：帶底線欄位列
// ─────────────────────────────────────────────────────────────────────────────

function FieldLine({ label }: { label: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldLine} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SignatureBlock 主元件
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SignatureBlockProps {}

export function SignatureBlock(_props: SignatureBlockProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>肆、簽章欄</Text>

      <View style={styles.grid}>

        {/* 賣方 */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>賣方（出賣人）</Text>
          <FieldLine label="簽　　名" />
          <FieldLine label="身分證字號" />
          <FieldLine label="地　　址" />
          <FieldLine label="電　　話" />
          <FieldLine label="日　　期" />
        </View>

        {/* 買方 */}
        <View style={styles.blockWide}>
          <Text style={styles.blockTitle}>買方（買受人）</Text>
          <FieldLine label="簽　　名" />
          <FieldLine label="身分證字號" />
          <FieldLine label="地　　址" />
          <FieldLine label="電　　話" />
          <FieldLine label="日　　期" />
        </View>

        {/* 不動產經紀人 */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>不動產經紀人</Text>
          <FieldLine label="簽　　名" />
          <FieldLine label="證書字號" />
          <FieldLine label="統一編號" />
        </View>

        {/* 不動產經紀業 */}
        <View style={styles.blockWide}>
          <Text style={styles.blockTitle}>不動產經紀業</Text>
          <FieldLine label="公司名稱" />
          <FieldLine label="負 責 人" />
          <FieldLine label="營業地址" />
          <FieldLine label="電　　話" />
          <FieldLine label="統一編號" />
          <FieldLine label="日　　期" />
        </View>

      </View>

      <Text style={styles.note}>
        ※ 本同意書共計　　頁，以上欄位均由當事人親自簽署確認。{"\n"}
        ※ 本文件依不動產經紀業管理條例第 22 條規定製作，具法律效力。
      </Text>
    </Page>
  );
}
