// 土地版現況調查表 HTML 頁面元件
// 對應「肆、不動產現況說明書（土地）」35 題

import React from "react";
import {
  LAND_SURVEY_QUESTIONS,
  Q14_NUISANCE_ITEMS,
  type LandSurveyData,
} from "@/lib/disclosure-schema-land-survey";
import type { HtmlThemeTokens } from "../html-themes";

// ─── 輔助函式 ────────────────────────────────────────────────────────────────

/** 取得 checkbox 符號 */
function getCheckbox(value: boolean | null, forTrue: boolean): string {
  if (value === null) return "☐";
  return value === forTrue ? "☑" : "☐";
}

// ─── 子元件 ──────────────────────────────────────────────────────────────────

/** 渲染單一題目行（一般題） */
function QuestionRow({
  index,
  label,
  value,
  tokens,
}: {
  index: number;
  label: string;
  value: boolean | null;
  tokens: HtmlThemeTokens;
}) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottom: `0.5px solid ${tokens.border}`,
    paddingTop: 4,
    paddingBottom: 4,
  };

  const noStyle: React.CSSProperties = {
    width: 22,
    fontSize: "8.5px",
    color: tokens.textMuted,
    paddingTop: 1,
    flexShrink: 0,
  };

  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "8.5px",
    lineHeight: 1.4,
    paddingRight: 8,
    color: tokens.text,
  };

  const answerGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    width: 90,
    justifyContent: "flex-end",
    gap: 6,
    flexShrink: 0,
  };

  const answerItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  };

  const checkboxStyle: React.CSSProperties = {
    fontSize: "9px",
    lineHeight: 1,
  };

  const answerLabelStyle: React.CSSProperties = {
    fontSize: "8px",
    color: tokens.text,
  };

  return (
    <div style={rowStyle}>
      <span style={noStyle}>{index}.</span>
      <span style={labelStyle}>{label}</span>
      <div style={answerGroupStyle}>
        <div style={answerItemStyle}>
          <span style={checkboxStyle}>{getCheckbox(value, true)}</span>
          <span style={answerLabelStyle}>是</span>
        </div>
        <div style={answerItemStyle}>
          <span style={checkboxStyle}>{getCheckbox(value, false)}</span>
          <span style={answerLabelStyle}>否</span>
        </div>
        <div style={answerItemStyle}>
          <span style={checkboxStyle}>{value === null ? "☑" : "☐"}</span>
          <span style={answerLabelStyle}>未填</span>
        </div>
      </div>
    </div>
  );
}

/** 渲染題 14（嫌惡設施，含多選 grid） */
function Question14Row({
  value,
  tokens,
}: {
  value: boolean | null;
  tokens: HtmlThemeTokens;
}) {
  const q = LAND_SURVEY_QUESTIONS[13]; // index 13 = q14

  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottom: `0.5px solid ${tokens.border}`,
    paddingTop: 4,
    paddingBottom: 4,
  };

  const noStyle: React.CSSProperties = {
    width: 22,
    fontSize: "8.5px",
    color: tokens.textMuted,
    paddingTop: 1,
    flexShrink: 0,
  };

  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "8.5px",
    lineHeight: 1.4,
    paddingRight: 8,
    color: tokens.text,
  };

  const answerGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    width: 90,
    justifyContent: "flex-end",
    gap: 6,
    flexShrink: 0,
  };

  const answerItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  };

  const checkboxStyle: React.CSSProperties = {
    fontSize: "9px",
    lineHeight: 1,
  };

  const answerLabelStyle: React.CSSProperties = {
    fontSize: "8px",
    color: tokens.text,
  };

  const nuisanceGridStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginLeft: 22,
    marginBottom: 4,
    border: `0.5px solid ${tokens.border}`,
    padding: 4,
    backgroundColor: tokens.bgAlt,
  };

  const nuisanceItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "20%",
    gap: 2,
    paddingTop: 1.5,
    paddingBottom: 1.5,
    paddingLeft: 2,
    paddingRight: 2,
  };

  const nuisanceLabelStyle: React.CSSProperties = {
    fontSize: "7.5px",
    color: tokens.text,
  };

  return (
    <div>
      <div style={rowStyle}>
        <span style={noStyle}>14.</span>
        <span style={labelStyle}>{q.label}</span>
        <div style={answerGroupStyle}>
          <div style={answerItemStyle}>
            <span style={checkboxStyle}>{getCheckbox(value, true)}</span>
            <span style={answerLabelStyle}>是</span>
          </div>
          <div style={answerItemStyle}>
            <span style={checkboxStyle}>{getCheckbox(value, false)}</span>
            <span style={answerLabelStyle}>否</span>
          </div>
          <div style={answerItemStyle}>
            <span style={checkboxStyle}>{value === null ? "☑" : "☐"}</span>
            <span style={answerLabelStyle}>未填</span>
          </div>
        </div>
      </div>
      {/* 嫌惡設施子項目 5 欄 grid */}
      <div style={nuisanceGridStyle}>
        {Q14_NUISANCE_ITEMS.map((item) => (
          <div key={item} style={nuisanceItemStyle}>
            <span style={checkboxStyle}>☐</span>
            <span style={nuisanceLabelStyle}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 渲染題 35（賣方確認聲明） */
function Question35Declaration({
  value,
  tokens,
}: {
  value: boolean | null;
  tokens: HtmlThemeTokens;
}) {
  const q = LAND_SURVEY_QUESTIONS[34]; // index 34 = q35

  const declarationRowStyle: React.CSSProperties = {
    marginTop: 8,
    padding: 8,
    border: `0.5px solid ${tokens.textMuted}`,
    backgroundColor: tokens.bgAlt,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  };

  const checkboxStyle: React.CSSProperties = {
    fontSize: "9px",
    lineHeight: 1,
    flexShrink: 0,
  };

  const declarationTextStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "8.5px",
    lineHeight: 1.4,
    fontWeight: "bold",
    color: tokens.text,
  };

  return (
    <div style={declarationRowStyle}>
      <span style={checkboxStyle}>{value === true ? "☑" : "☐"}</span>
      <span style={declarationTextStyle}>{q.label}</span>
    </div>
  );
}

// ─── 分頁配置 ────────────────────────────────────────────────────────────────
// 區塊 1：q1–q9（一般使用與法定限制）
// 區塊 2：q10–q14（保護區、嫌惡設施——q14 佔額外空間）
// 區塊 3：q15–q25（地上物、歷史事故、地質）
// 區塊 4：q26–q35（災害、地政、確認聲明）

const PAGE_RANGES: Array<[number, number]> = [
  [1, 9],
  [10, 14],
  [15, 25],
  [26, 35],
];

// ─── 主元件 ──────────────────────────────────────────────────────────────────

export interface HtmlLandConditionSurveyProps {
  surveyData: Record<string, boolean | null> | null;
  tokens: HtmlThemeTokens;
}

export function HtmlLandConditionSurvey({
  surveyData,
  tokens,
}: HtmlLandConditionSurveyProps): React.ReactElement {
  /** 取得題目答案（null = 未填） */
  function getAnswer(qId: string): boolean | null {
    if (!surveyData) return null;
    const val = surveyData[qId];
    if (val === true) return true;
    if (val === false) return false;
    return null;
  }

  const pageStyle: React.CSSProperties = {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 32,
    paddingRight: 32,
    fontSize: "9px",
    color: tokens.text,
    backgroundColor: tokens.bg,
    fontFamily: "sans-serif",
    pageBreakAfter: "always",
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
    color: tokens.text,
  };

  return (
    <>
      {PAGE_RANGES.map(([from, to], pageIndex) => {
        const questionsOnPage = LAND_SURVEY_QUESTIONS.slice(from - 1, to);

        return (
          <div
            key={`land-survey-${pageIndex}`}
            style={pageStyle}
          >
            {/* 頁標題 */}
            <p style={pageTitleStyle}>肆、不動產現況說明書（土地）</p>

            {/* 題目清單 */}
            {questionsOnPage.map((q, idx) => {
              const qNo = from + idx;
              const value = getAnswer(q.id);

              // 題 35 — 確認聲明特殊渲染
              if (qNo === 35) {
                return (
                  <Question35Declaration
                    key={q.id}
                    value={value}
                    tokens={tokens}
                  />
                );
              }

              // 題 14 — 嫌惡設施含子項目 grid
              if (qNo === 14) {
                return (
                  <Question14Row key={q.id} value={value} tokens={tokens} />
                );
              }

              // 一般題
              return (
                <QuestionRow
                  key={q.id}
                  index={qNo}
                  label={q.label}
                  value={value}
                  tokens={tokens}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
