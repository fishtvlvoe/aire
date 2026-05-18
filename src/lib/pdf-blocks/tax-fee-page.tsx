import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CaseDossierData } from "@/lib/pdf-engine/document";

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
    marginBottom: 14,
    color: "#1a1a1a",
    borderBottom: "1.5pt solid #1a1a1a",
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    color: "#333",
  },
  table: {
    width: "100%",
    borderTop: "0.5pt solid #999",
    borderLeft: "0.5pt solid #999",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #999",
  },
  cellLabel: {
    width: "45%",
    borderRight: "0.5pt solid #999",
    padding: "5 8",
    backgroundColor: "#f5f5f5",
    color: "#444",
    fontSize: 9,
  },
  cellValue: {
    width: "55%",
    padding: "5 8",
    color: "#111",
    fontSize: 9,
  },
  cellBold: {
    width: "45%",
    borderRight: "0.5pt solid #999",
    padding: "5 8",
    backgroundColor: "#e8e8e8",
    color: "#111",
    fontSize: 9,
    fontWeight: "bold",
  },
  cellValueBold: {
    width: "55%",
    padding: "5 8",
    color: "#111",
    fontSize: 9,
    fontWeight: "bold",
  },
  blank: {
    color: "#aaa",
  },
  warningBox: {
    marginTop: 8,
    padding: "6 8",
    backgroundColor: "#fff8e1",
    border: "0.5pt solid #f0c040",
  },
  warningText: {
    fontSize: 8,
    color: "#7a5c00",
    lineHeight: 1.5,
  },
  note: {
    fontSize: 8,
    color: "#888",
    marginTop: 6,
    lineHeight: 1.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：格式化數字（有值 → NT$xxx；無值 → 底線）
// ─────────────────────────────────────────────────────────────────────────────

function fmtNTD(val: number | null | undefined): string {
  if (val == null || val === 0) return "";
  return `NT$ ${val.toLocaleString("zh-TW")}`;
}

function fmtOrBlank(val: number | null | undefined): string {
  if (val == null) return "";
  return val.toLocaleString("zh-TW");
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TaxFeePageProps {
  taxCalculation: CaseDossierData["taxCalculation"];
  propertyType: "land" | "building";
}

// ─────────────────────────────────────────────────────────────────────────────
// 頁面 A：增值稅概算表
// ─────────────────────────────────────────────────────────────────────────────

export function LandValueTaxPage({ taxCalculation, propertyType }: TaxFeePageProps) {
  const tc = taxCalculation;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>叁、土地增值稅概算表</Text>

      {/* 土地增值稅試算結果 */}
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellBold}>稅率類別</Text>
          <Text style={styles.cellValueBold}>試算稅額</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>一般稅率（累進 20%／30%／40%）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.landValueIncrementTax) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>優惠稅率（自用住宅 10%）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.landValueIncrementTaxPreferential) : ""}
          </Text>
        </View>
      </View>

      {/* 計算過程 */}
      <Text style={styles.subtitle}>計算說明</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>成交總價（元）</Text>
          <Text style={styles.cellValue}>{fmtOrBlank(null)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>土地漲價總額（元）</Text>
          <Text style={styles.cellValue}>{fmtOrBlank(null)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>適用級距</Text>
          <Text style={styles.cellValue}>{tc ? "依漲幅比例計算" : ""}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>土地交易類型</Text>
          <Text style={styles.cellValue}>
            {propertyType === "land" ? "純土地交易" : "建物（含土地估算 40%）"}
          </Text>
        </View>
      </View>

      {/* 備注 */}
      <Text style={styles.note}>
        ※ 本試算表僅供參考，實際稅額依主管機關核定為準。{"\n"}
        ※ 一般稅率採累進計算：漲幅≤原價 20%；超出原價至2倍部分 30%；超出2倍部分 40%。{"\n"}
        ※ 自用住宅優惠稅率 10%，需符合土地稅法第 34 條規定。
      </Text>

      {/* 警告 */}
      {tc && tc.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {tc.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>⚠ {w}</Text>
          ))}
        </View>
      )}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 頁面 B：費用一覽表
// ─────────────────────────────────────────────────────────────────────────────

export function TaxFeeOverviewPage({ taxCalculation, propertyType }: TaxFeePageProps) {
  const tc = taxCalculation;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>貳、費用一覽表</Text>

      {/* 賣方費用 */}
      <Text style={styles.subtitle}>賣方費用</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellBold}>項目</Text>
          <Text style={styles.cellValueBold}>金額（元）</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>土地增值稅（一般稅率）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.landValueIncrementTax) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>印花稅（成交價 × 0.1%）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.stampTax) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellBold}>賣方小計</Text>
          <Text style={styles.cellValueBold}>
            {tc ? fmtNTD(tc.totalSellerCost) : ""}
          </Text>
        </View>
      </View>

      {/* 買方費用 */}
      <Text style={styles.subtitle}>買方費用</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellBold}>項目</Text>
          <Text style={styles.cellValueBold}>金額（元）</Text>
        </View>
        {propertyType === "building" && (
          <View style={styles.row}>
            <Text style={styles.cellLabel}>契稅（成交價 × 6%）</Text>
            <Text style={styles.cellValue}>
              {tc ? fmtNTD(tc.deedTax) : ""}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.cellLabel}>印花稅（成交價 × 0.1%）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.stampTax) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>登記規費（成交價 × 0.1%）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.registrationFee) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>代書費（固定）</Text>
          <Text style={styles.cellValue}>
            {tc ? fmtNTD(tc.scrivenerFee) : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellBold}>買方小計</Text>
          <Text style={styles.cellValueBold}>
            {tc ? fmtNTD(tc.totalBuyerCost) : ""}
          </Text>
        </View>
      </View>

      {/* 備注 */}
      <Text style={styles.note}>
        ※ 本費用試算僅供參考，依實際成交條件及稅務機關核定為準。{"\n"}
        ※ 契稅僅適用建物交易；土地純地價交易不課契稅。{"\n"}
        ※ 代書費為估算，實際依委託事務範圍而定。
      </Text>

      {/* 警告 */}
      {tc && tc.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {tc.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>⚠ {w}</Text>
          ))}
        </View>
      )}
    </Page>
  );
}
