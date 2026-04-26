"use client";

export type SourceOption = {
  attachmentId: string;
  filename: string;
  value: string | number | null;
  confidence: number;
};

export type SourceSwitcherProps = {
  fieldKey: string;
  listingId: number;
  currentSource: string;
  options: SourceOption[];
  /** 切換完成後的回調，傳入選中的 attachmentId */
  onSwitch: (attachmentId: string) => void;
};

/**
 * SourceSwitcher — 有衝突欄位的來源切換下拉
 *
 * 只在 options.length > 1 時渲染；
 * 切換時呼叫 POST /api/listings/[id]/field-visit/switch-source
 */
export default function SourceSwitcher({
  fieldKey,
  listingId,
  currentSource,
  options,
  onSwitch,
}: SourceSwitcherProps) {
  // 只有多個來源才需要顯示
  if (options.length <= 1) return null;

  const handleChange = async (attachmentId: string) => {
    try {
      await fetch(`/api/listings/${listingId}/field-visit/switch-source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldKey, attachmentId }),
      });
    } catch {
      // API 由另一包實作，這裡靜默失敗，UI 仍先切換
    }

    onSwitch(attachmentId);
  };

  return (
    <div className="ml-2 inline-flex items-center">
      <select
        value={currentSource}
        onChange={(e) => void handleChange(e.target.value)}
        className="rounded border border-slate-300 bg-white py-0.5 pl-1.5 pr-5 text-xs text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
        title="切換資料來源"
        aria-label={`切換 ${fieldKey} 資料來源`}
      >
        {options.map((opt) => (
          <option key={opt.attachmentId} value={opt.attachmentId}>
            {opt.filename}
            {opt.value !== null ? ` — ${opt.value}` : ""}
            {` (${(opt.confidence * 100).toFixed(0)}%)`}
          </option>
        ))}
      </select>
    </div>
  );
}
