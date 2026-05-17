// 成屋版現況調查表 HTML 元件
// 對應「肆、不動產現況說明書（建物）」58 題

import React from "react";
import type { HtmlThemeTokens } from "../html-themes";
import {
  BUILDING_SURVEY_QUESTIONS,
} from "@/lib/disclosure-schema-building-survey";
import { Q14_NUISANCE_ITEMS } from "@/lib/disclosure-schema-land-survey";

// ─── 輔助函式 ────────────────────────────────────────────────────────────────

/** 取得 checkbox 符號：勾選 ☑，空白 ☐ */
function getCheckbox(value: boolean | null, forTrue: boolean): string {
  if (value === null) return "☐";
  return value === forTrue ? "☑" : "☐";
}

// ─── Section 標題對應 ────────────────────────────────────────────────────────

const SECTION_DISPLAY: Record<string, string> = {
  基地現況調查: "一、基地現況調查（共 35 題）",
  稅費告知: "二、稅費相關告知",
  建物瑕疵: "三、建物瑕疵調查",
  設備狀況: "四、設備狀況",
  管理狀況: "五、管理狀況",
  停車位: "六、停車位",
};

// ─── 子元件 ──────────────────────────────────────────────────────────────────

/** 一般題目行 */
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
    fontSize: 8.5,
    color: tokens.textMuted,
    paddingTop: 1,
    flexShrink: 0,
    fontFamily: tokens.fontFamily,
  };
  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    paddingRight: 8,
    fontFamily: tokens.fontFamily,
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
    fontSize: 9,
    lineHeight: 1,
    fontFamily: tokens.fontFamily,
  };
  const answerLabelStyle: React.CSSProperties = {
    fontSize: 8,
    color: tokens.text,
    fontFamily: tokens.fontFamily,
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

/** 題 14：嫌惡設施，含 5 欄多選 grid */
function Question14Row({
  value,
  tokens,
}: {
  value: boolean | null;
  tokens: HtmlThemeTokens;
}) {
  const q = BUILDING_SURVEY_QUESTIONS[13]; // index 13 = q14

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
    fontSize: 8.5,
    color: tokens.textMuted,
    paddingTop: 1,
    flexShrink: 0,
    fontFamily: tokens.fontFamily,
  };
  const labelStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    paddingRight: 8,
    fontFamily: tokens.fontFamily,
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
    fontSize: 9,
    lineHeight: 1,
    fontFamily: tokens.fontFamily,
  };
  const answerLabelStyle: React.CSSProperties = {
    fontSize: 8,
    color: tokens.text,
    fontFamily: tokens.fontFamily,
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
    fontSize: 7.5,
    color: tokens.text,
    fontFamily: tokens.fontFamily,
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

/** 題 35：賣方確認聲明（特殊框框樣式） */
function Question35Declaration({
  value,
  tokens,
}: {
  value: boolean | null;
  tokens: HtmlThemeTokens;
}) {
  const q = BUILDING_SURVEY_QUESTIONS[34]; // index 34 = q35

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
    fontSize: 9,
    lineHeight: 1,
    fontFamily: tokens.fontFamily,
    flexShrink: 0,
  };
  const declarationTextStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
    fontWeight: "bold",
    fontFamily: tokens.fontFamily,
    color: tokens.text,
  };

  return (
    <div style={declarationRowStyle}>
      <span style={checkboxStyle}>{value === true ? "☑" : "☐"}</span>
      <span style={declarationTextStyle}>{q.label}</span>
    </div>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────

interface HtmlBuildingConditionSurveyProps {
  surveyData: Record<string, boolean | null> | null;
  tokens: HtmlThemeTokens;
}

export function HtmlBuildingConditionSurvey({
  surveyData,
  tokens,
}: HtmlBuildingConditionSurveyProps): React.ReactElement {
  /** 取得題目答案（null = 未填） */
  function getAnswer(qId: string): boolean | null {
    if (!surveyData) return null;
    const val = surveyData[qId];
    if (val === true) return true;
    if (val === false) return false;
    return null;
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: tokens.fontFamily,
    fontSize: 9,
    color: tokens.text,
    backgroundColor: tokens.bg,
    padding: "28px 32px",
  };
  const pageTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
    color: tokens.text,
    fontFamily: tokens.fontFamily,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    color: tokens.text,
    borderBottom: `1px solid ${tokens.border}`,
    paddingBottom: 3,
    fontFamily: tokens.fontFamily,
  };

  // 追蹤已渲染過的 section，避免重複顯示標題
  const renderedSections = new Set<string>();

  return (
    <div style={containerStyle}>
      {/* 頁標題 */}
      <p style={pageTitleStyle}>肆、不動產現況說明書（建物）</p>

      {/* 全部 58 題 */}
      {BUILDING_SURVEY_QUESTIONS.map((q, idx) => {
        const qNo = idx + 1;
        const value = getAnswer(q.id);
        const elements: React.ReactNode[] = [];

        // Section 標題（每個 section 第一題前插入）
        if (!renderedSections.has(q.section)) {
          renderedSections.add(q.section);
          elements.push(
            <p key={`section-${q.section}`} style={sectionTitleStyle}>
              {SECTION_DISPLAY[q.section] ?? q.section}
            </p>
          );
        }

        // 題 35 — 確認聲明特殊渲染
        if (qNo === 35) {
          elements.push(
            <Question35Declaration key={q.id} value={value} tokens={tokens} />
          );
          return <React.Fragment key={q.id}>{elements}</React.Fragment>;
        }

        // 題 14 — 嫌惡設施含子項目 grid
        if (qNo === 14) {
          elements.push(
            <Question14Row key={q.id} value={value} tokens={tokens} />
          );
          return <React.Fragment key={q.id}>{elements}</React.Fragment>;
        }

        // 一般題
        elements.push(
          <QuestionRow
            key={q.id}
            index={qNo}
            label={q.label}
            value={value}
            tokens={tokens}
          />
        );

        return <React.Fragment key={q.id}>{elements}</React.Fragment>;
      })}
    </div>
  );
}
