import React, { CSSProperties } from "react";
import type { HtmlThemeTokens } from "../html-themes";
import type { CaseDossierData } from "@/lib/pdf-engine/document";

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：格式化數字（有值 → NT$xxx；無值 → 底線）
// ─────────────────────────────────────────────────────────────────────────────

function fmtNTD(val: number | null | undefined): string {
  if (val == null || val === 0) return "________________";
  return `NT$ ${val.toLocaleString("zh-TW")}`;
}

function fmtOrBlank(val: number | null | undefined): string {
  if (val == null) return "________________";
  return val.toLocaleString("zh-TW");
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface HtmlTaxFeeProps {
  tokens: HtmlThemeTokens;
  taxCalculation: CaseDossierData["taxCalculation"];
  propertyType: "land" | "building";
}

// ─────────────────────────────────────────────────────────────────────────────
// 內部樣式工廠（依 token 動態產生）
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(tokens: HtmlThemeTokens) {
  const base: CSSProperties = {
    fontFamily: tokens.fontFamily,
    fontSize: 10,
    color: tokens.text,
  };

  const section: CSSProperties = {
    marginBottom: 24,
  };

  const title: CSSProperties = {
    ...base,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 14,
    color: tokens.text,
    borderBottom: `1.5px solid ${tokens.text}`,
    paddingBottom: 4,
  };

  const subtitle: CSSProperties = {
    ...base,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    color: tokens.text,
  };

  const table: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    borderTop: `0.5px solid ${tokens.border}`,
    borderLeft: `0.5px solid ${tokens.border}`,
    marginBottom: 12,
    tableLayout: "fixed",
  };

  const cellBase: CSSProperties = {
    ...base,
    fontSize: 9,
    padding: "5px 8px",
    borderRight: `0.5px solid ${tokens.border}`,
    borderBottom: `0.5px solid ${tokens.border}`,
    verticalAlign: "middle",
    wordBreak: "break-word",
  };

  const cellLabel: CSSProperties = {
    ...cellBase,
    width: "45%",
    backgroundColor: tokens.bgAlt,
    color: tokens.textMuted,
  };

  const cellValue: CSSProperties = {
    ...cellBase,
    width: "55%",
    backgroundColor: tokens.bg,
    color: tokens.text,
  };

  const cellBold: CSSProperties = {
    ...cellBase,
    width: "45%",
    backgroundColor: "#e8e8e8",
    color: tokens.text,
    fontWeight: "bold",
  };

  const cellValueBold: CSSProperties = {
    ...cellBase,
    width: "55%",
    backgroundColor: tokens.bg,
    color: tokens.text,
    fontWeight: "bold",
  };

  const note: CSSProperties = {
    ...base,
    fontSize: 8,
    color: tokens.textMuted,
    marginTop: 6,
    lineHeight: 1.5,
    whiteSpace: "pre-line",
  };

  const warningBox: CSSProperties = {
    marginTop: 8,
    padding: "6px 8px",
    backgroundColor: "#fff8e1",
    border: "0.5px solid #f0c040",
  };

  const warningText: CSSProperties = {
    ...base,
    fontSize: 8,
    color: "#7a5c00",
    lineHeight: 1.5,
  };

  return {
    base, section, title, subtitle, table,
    cellLabel, cellValue, cellBold, cellValueBold,
    note, warningBox, warningText,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 主元件：HtmlTaxFee
// 合併「叁、土地增值稅概算表」與「貳、費用一覽表」兩區段
// ─────────────────────────────────────────────────────────────────────────────

export function HtmlTaxFee({ tokens, taxCalculation, propertyType }: HtmlTaxFeeProps) {
  const tc = taxCalculation;
  const s = makeStyles(tokens);

  return (
    <div style={s.base}>

      {/* ── 叁、土地增值稅概算表 ───────────────────────────── */}
      <div style={s.section}>
        <p style={s.title}>叁、土地增值稅概算表</p>

        {/* 試算結果 */}
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.cellBold}>稅率類別</td>
              <td style={s.cellValueBold}>試算稅額</td>
            </tr>
            <tr>
              <td style={s.cellLabel}>一般稅率（累進 20%／30%／40%）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.landValueIncrementTax) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellLabel}>優惠稅率（自用住宅 10%）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.landValueIncrementTaxPreferential) : "________________"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 計算說明 */}
        <p style={s.subtitle}>計算說明</p>
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.cellLabel}>成交總價（元）</td>
              <td style={s.cellValue}>{fmtOrBlank(null)}</td>
            </tr>
            <tr>
              <td style={s.cellLabel}>土地漲價總額（元）</td>
              <td style={s.cellValue}>{fmtOrBlank(null)}</td>
            </tr>
            <tr>
              <td style={s.cellLabel}>適用級距</td>
              <td style={s.cellValue}>
                {tc ? "依漲幅比例計算" : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellLabel}>土地交易類型</td>
              <td style={s.cellValue}>
                {propertyType === "land" ? "純土地交易" : "建物（含土地估算 40%）"}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={s.note}>
          {"※ 本試算表僅供參考，實際稅額依主管機關核定為準。\n"}
          {"※ 一般稅率採累進計算：漲幅≤原價 20%；超出原價至2倍部分 30%；超出2倍部分 40%。\n"}
          {"※ 自用住宅優惠稅率 10%，需符合土地稅法第 34 條規定。"}
        </p>

        {tc && tc.warnings.length > 0 && (
          <div style={s.warningBox}>
            {tc.warnings.map((w, i) => (
              <p key={i} style={s.warningText}>⚠ {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── 貳、費用一覽表 ────────────────────────────────── */}
      <div style={s.section}>
        <p style={s.title}>貳、費用一覽表</p>

        {/* 賣方費用 */}
        <p style={s.subtitle}>賣方費用</p>
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.cellBold}>項目</td>
              <td style={s.cellValueBold}>金額（元）</td>
            </tr>
            <tr>
              <td style={s.cellLabel}>土地增值稅（一般稅率）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.landValueIncrementTax) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellLabel}>印花稅（成交價 × 0.1%）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.stampTax) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellBold}>賣方小計</td>
              <td style={s.cellValueBold}>
                {tc ? fmtNTD(tc.totalSellerCost) : "________________"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 買方費用 */}
        <p style={s.subtitle}>買方費用</p>
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.cellBold}>項目</td>
              <td style={s.cellValueBold}>金額（元）</td>
            </tr>
            {propertyType === "building" && (
              <tr>
                <td style={s.cellLabel}>契稅（成交價 × 6%）</td>
                <td style={s.cellValue}>
                  {tc ? fmtNTD(tc.deedTax) : "________________"}
                </td>
              </tr>
            )}
            <tr>
              <td style={s.cellLabel}>印花稅（成交價 × 0.1%）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.stampTax) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellLabel}>登記規費（成交價 × 0.1%）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.registrationFee) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellLabel}>代書費（固定）</td>
              <td style={s.cellValue}>
                {tc ? fmtNTD(tc.scrivenerFee) : "________________"}
              </td>
            </tr>
            <tr>
              <td style={s.cellBold}>買方小計</td>
              <td style={s.cellValueBold}>
                {tc ? fmtNTD(tc.totalBuyerCost) : "________________"}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={s.note}>
          {"※ 本費用試算僅供參考，依實際成交條件及稅務機關核定為準。\n"}
          {"※ 契稅僅適用建物交易；土地純地價交易不課契稅。\n"}
          {"※ 代書費為估算，實際依委託事務範圍而定。"}
        </p>

        {tc && tc.warnings.length > 0 && (
          <div style={s.warningBox}>
            {tc.warnings.map((w, i) => (
              <p key={i} style={s.warningText}>⚠ {w}</p>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
