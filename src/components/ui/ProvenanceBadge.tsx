"use client";

import type { FieldProvenance } from "@/lib/ocr";

export type ProvenanceBadgeProps = {
  provenance: FieldProvenance;
  confidence?: number;
};

/** 各 provenance 的樣式與文字設定 */
const BADGE_CONFIG: Record<
  FieldProvenance,
  { base: string; label: string } | null
> = {
  "ocr-pdf": {
    base: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "已從謄本帶入",
  },
  "ocr-image": {
    base: "bg-amber-50 text-amber-700 border-amber-200",
    label: "已帶入，請確認",
  },
  "llm-vision": {
    base: "bg-purple-50 text-purple-700 border-purple-200",
    label: "AI 推論",
  },
  manual: null, // 人工輸入不顯示徽章
  "manual-edit": {
    base: "bg-slate-50 text-slate-500 border-slate-200",
    label: "已修改",
  },
};

/**
 * ProvenanceBadge — 顯示欄位資料來源的小型徽章
 *
 * 信心分數 < 0.85 時加虛線邊框並附「請確認」警示文字
 */
export default function ProvenanceBadge({
  provenance,
  confidence,
}: ProvenanceBadgeProps) {
  const config = BADGE_CONFIG[provenance];

  // manual 不顯示任何徽章
  if (!config) return null;

  // 低信心：邊框改虛線並加警示後綴
  const isLowConfidence = typeof confidence === "number" && confidence < 0.85;
  const borderStyle = isLowConfidence ? "border-dashed" : "border";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${borderStyle} ${config.base}`}
      title={
        typeof confidence === "number"
          ? `信心分數：${(confidence * 100).toFixed(0)}%`
          : undefined
      }
    >
      {config.label}
      {isLowConfidence && (
        <span className="ml-1 text-amber-600">⚠ 請確認</span>
      )}
    </span>
  );
}
