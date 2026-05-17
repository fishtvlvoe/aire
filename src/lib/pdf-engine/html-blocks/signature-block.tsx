import React from "react";
import type { CSSProperties } from "react";
import type { HtmlThemeTokens } from "../html-themes";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface HtmlSignatureBlockFullProps {
  tokens: HtmlThemeTokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：帶底線欄位列
// ─────────────────────────────────────────────────────────────────────────────

function FieldLine({
  label,
  tokens,
}: {
  label: string;
  tokens: HtmlThemeTokens;
}) {
  const rowStyle: CSSProperties = {
    alignItems: "flex-end",
    display: "flex",
    marginBottom: 8,
  };

  const labelStyle: CSSProperties = {
    color: tokens.textMuted,
    flexShrink: 0,
    fontFamily: tokens.fontFamily,
    fontSize: 8,
    width: 64,
  };

  const lineStyle: CSSProperties = {
    borderBottom: `0.6px solid #333`,
    flex: 1,
    minHeight: 14,
  };

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={lineStyle} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 方塊定義
// ─────────────────────────────────────────────────────────────────────────────

interface BlockConfig {
  title: string;
  fields: string[];
}

const BLOCKS: BlockConfig[] = [
  {
    title: "賣方（出賣人）",
    fields: ["簽　　名", "身分證字號", "地　　址", "電　　話", "日　　期"],
  },
  {
    title: "買方（買受人）",
    fields: ["簽　　名", "身分證字號", "地　　址", "電　　話", "日　　期"],
  },
  {
    title: "不動產經紀人",
    fields: ["簽　　名", "證書字號", "統一編號"],
  },
  {
    title: "不動產經紀業",
    fields: [
      "公司名稱",
      "負 責 人",
      "營業地址",
      "電　　話",
      "統一編號",
      "日　　期",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HtmlSignatureBlockFull — 完整版簽章欄（含各方詳細欄位與備注）
// ─────────────────────────────────────────────────────────────────────────────

export function HtmlSignatureBlockFull({ tokens }: HtmlSignatureBlockFullProps) {
  const wrapperStyle: CSSProperties = {
    fontFamily: tokens.fontFamily,
    fontSize: 10,
  };

  const titleStyle: CSSProperties = {
    borderBottom: `1.5px solid ${tokens.text}`,
    color: tokens.text,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 16,
    paddingBottom: 4,
  };

  const gridStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  };

  const blockStyle: CSSProperties = {
    border: `0.8px solid #555`,
    boxSizing: "border-box",
    minHeight: 140,
    padding: "10px 12px",
    width: "calc(50% - 6px)",
  };

  const blockTitleStyle: CSSProperties = {
    borderBottom: `0.5px solid #aaa`,
    color: tokens.text,
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    paddingBottom: 4,
  };

  const noteStyle: CSSProperties = {
    color: "#888",
    fontSize: 7.5,
    lineHeight: 1.5,
    marginTop: 12,
  };

  return (
    <div style={wrapperStyle}>
      <p style={titleStyle}>肆、簽章欄</p>

      <div style={gridStyle}>
        {BLOCKS.map((block) => (
          <div key={block.title} style={blockStyle}>
            <p style={blockTitleStyle}>{block.title}</p>
            {block.fields.map((field) => (
              <FieldLine key={field} label={field} tokens={tokens} />
            ))}
          </div>
        ))}
      </div>

      <p style={noteStyle}>
        ※ 本同意書共計　　頁，以上欄位均由當事人親自簽署確認。
        <br />
        ※ 本文件依不動產經紀業管理條例第 22 條規定製作，具法律效力。
      </p>
    </div>
  );
}
