/**
 * AiBadge — AI 標誌元件
 *
 * 從 useTheme().tokens.colors 取 badge 色
 * 渲染圓形 View + Text "AI" 在右上角
 * 所有主題共用（樣式由 token 決定）
 */

import React from "react";
import { useTheme } from "../pdf-themes/theme-provider";

// ─────────────────────────────────────────────────────────────────────────────
// AiBadge Props
// ─────────────────────────────────────────────────────────────────────────────
export interface AiBadgeProps {
  /** 覆蓋預設位置 style（right-top corner）*/
  style?: React.CSSProperties;
  /** badge 文字，預設 "AI" */
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AiBadge 元件
// ─────────────────────────────────────────────────────────────────────────────
export const AiBadge: React.FC<AiBadgeProps> = ({
  style,
  label = "AI",
}) => {
  const theme = useTheme();
  const { tokens } = theme;

  // 取 badge 色：優先 colors.accent，fallback primaryColor
  const badgeBg =
    tokens.colors?.accent ?? tokens.accentColor ?? tokens.primaryColor;
  const badgeText = "#FFFFFF";

  const defaultStyle: React.CSSProperties = {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: badgeBg,
    color: badgeText,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    fontFamily: tokens.fontFamily,
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    zIndex: 10,
  };

  return (
    <div style={{ ...defaultStyle, ...style }} aria-label="AI generated">
      {label}
    </div>
  );
};

export default AiBadge;
