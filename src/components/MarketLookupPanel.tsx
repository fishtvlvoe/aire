'use client';

/**
 * 周邊行情查詢面板（業務工具）
 *
 * 功能：
 *  1. 三家平臺（591 實價登錄 / 591 待售 / 信義 / 樂屋）外連按鈕，新分頁打開預填查詢條件
 *  2. 周邊行情摘要 textarea（500 字元上限，自動儲存 onBlur）
 *  3. 附件上傳區（jpg/png/pdf, 5MB 單檔，10 個上限），即時上傳
 *
 * 法律邊界：系統 SHALL NOT 自行訪問 591/信義/樂屋（無 fetch、無 headless），
 *           所有第三方平臺存取由業務瀏覽器主動發起。
 */

import { useCallback, useMemo, useState } from 'react';
import {
  buildAllExternalUrls,
  type ExternalPlatformId,
} from '@/lib/external-links/url-builder';
import type { AttachmentMeta } from '@/lib/db';

const MARKET_SUMMARY_MAX = 500;
const FILE_SIZE_MAX = 5 * 1024 * 1024;
const ATTACHMENTS_MAX = 10;
const ALLOWED_MIME_LIST = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const LEGAL_DISCLOSURE_TEXT =
  '以下按鈕將在新分頁開啟外部網站，由您自行查看後填寫摘要與上傳截圖。本系統不會自動讀取或儲存第三方平臺內容。';

/** 從台灣地址抽出縣市 + 行政區（簡易解析，covers 大部分常見格式） */
function parseAddress(address: string | null | undefined): {
  city?: string;
  district?: string;
} {
  if (!address) return {};
  const cleaned = address.trim();
  const cityMatch = cleaned.match(/^(\S+?(?:市|縣))/u);
  const city = cityMatch?.[1];
  if (!city) return {};
  const rest = cleaned.slice(city.length);
  const districtMatch = rest.match(/^(\S+?(?:區|鄉|鎮|市))/u);
  const district = districtMatch?.[1];
  return { city, district };
}

export type MarketLookupPanelProps = {
  listingId: number;
  address: string | null | undefined;
  initialMarketSummary: string | null;
  initialAttachments: AttachmentMeta[];
  /** Fired after market_summary or attachments change persisted to backend，供父層同步 listing state */
  onPersisted?: () => void;
};

export default function MarketLookupPanel({
  listingId,
  address,
  initialMarketSummary,
  initialAttachments,
  onPersisted,
}: MarketLookupPanelProps) {
  const [summary, setSummary] = useState(initialMarketSummary ?? '');
  const [savedSummary, setSavedSummary] = useState(initialMarketSummary ?? '');
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<AttachmentMeta[]>(
    initialAttachments.filter((a) => a.type === 'market_research'),
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { city, district } = useMemo(() => parseAddress(address), [address]);

  const externalLinks = useMemo(() => {
    if (!city) return [];
    return buildAllExternalUrls(city, district);
  }, [city, district]);

  const isDirty = summary.trim() !== (savedSummary ?? '').trim();

  const persistSummary = useCallback(async () => {
    if (!isDirty) return;
    if (summary.length > MARKET_SUMMARY_MAX) {
      setSummaryError(`最多 ${MARKET_SUMMARY_MAX} 字元`);
      return;
    }
    setSavingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_summary: summary }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSavedSummary(summary);
      onPersisted?.();
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSavingSummary(false);
    }
  }, [isDirty, summary, listingId, onPersisted]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploadError(null);

      for (const file of Array.from(files)) {
        if (attachments.length >= ATTACHMENTS_MAX) {
          setUploadError(`最多 ${ATTACHMENTS_MAX} 個周邊行情附件`);
          return;
        }
        if (!ALLOWED_MIME_LIST.includes(file.type)) {
          setUploadError(`${file.name}：僅接受 jpg / png / pdf`);
          continue;
        }
        if (file.size > FILE_SIZE_MAX) {
          setUploadError(`${file.name}：超過 5MB（建議 1080p 截圖）`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'market_research');

        setUploading(true);
        try {
          const res = await fetch(`/api/listings/${listingId}/attachments`, {
            method: 'POST',
            body: formData,
          });
          const body = (await res.json().catch(() => ({}))) as {
            attachment?: AttachmentMeta;
            error?: string;
          };
          if (!res.ok || !body.attachment) {
            setUploadError(body.error ?? `上傳失敗 (HTTP ${res.status})`);
            continue;
          }
          setAttachments((prev) => [...prev, body.attachment as AttachmentMeta]);
          onPersisted?.();
        } catch (e) {
          setUploadError(e instanceof Error ? e.message : '上傳失敗');
        } finally {
          setUploading(false);
        }
      }
    },
    [attachments.length, listingId, onPersisted],
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      try {
        const res = await fetch(
          `/api/listings/${listingId}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
          { method: 'DELETE' },
        );
        if (!res.ok) return;
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        onPersisted?.();
      } catch {
        /* ignore — caller can retry */
      }
    },
    [listingId, onPersisted],
  );

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="market-lookup-heading"
    >
      <header className="mb-4">
        <h2 id="market-lookup-heading" className="text-lg font-semibold text-slate-800">
          周邊行情查詢
        </h2>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {LEGAL_DISCLOSURE_TEXT}
        </p>
      </header>

      {/* 外連按鈕區 */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-slate-700">
          打開外部平臺查詢{city ? `（${city}${district ?? ''}）` : ''}
        </p>
        {externalLinks.length === 0 ? (
          <p className="text-xs text-slate-500">
            （無物件地址或縣市未覆蓋；先在「委託前」階段填寫地址）
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {externalLinks.map(({ platform, label, result }) => (
              <ExternalLinkButton
                key={platform}
                href={result.url}
                label={label}
                coverage={result.coverage}
                platform={platform}
              />
            ))}
          </div>
        )}
      </div>

      {/* 摘要 textarea */}
      <div className="mb-5">
        <label
          htmlFor="market-summary"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          周邊行情摘要
          <span className="ml-2 text-xs font-normal text-slate-500">
            （業務查看後人工填寫，最多 {MARKET_SUMMARY_MAX} 字元）
          </span>
        </label>
        <textarea
          id="market-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, MARKET_SUMMARY_MAX))}
          onBlur={() => void persistSummary()}
          maxLength={MARKET_SUMMARY_MAX}
          rows={4}
          placeholder="例：同社區近三月成交 3 件，每坪 75–82 萬，待售 5 戶平均單價 80 萬，本案定價合理偏低。"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={summaryError ? 'text-red-600' : 'text-slate-500'}>
            {summaryError ? `⚠ ${summaryError}` : savingSummary ? '儲存中…' : isDirty ? '尚未儲存' : '已儲存'}
          </span>
          <span className="text-slate-500">
            {summary.length} / {MARKET_SUMMARY_MAX}
          </span>
        </div>
      </div>

      {/* 附件區 */}
      <div>
        <label
          htmlFor="market-attachment-input"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          周邊行情截圖附件
          <span className="ml-2 text-xs font-normal text-slate-500">
            （jpg / png / pdf，單檔最大 5MB，最多 {ATTACHMENTS_MAX} 個）
          </span>
        </label>
        <input
          id="market-attachment-input"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          disabled={uploading || attachments.length >= ATTACHMENTS_MAX}
          onChange={(e) => {
            void handleUpload(e.target.files);
            // 清空 input 以便重複上傳同名檔案
            e.target.value = '';
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        {uploadError && (
          <p className="mt-1 text-xs text-red-600">⚠ {uploadError}</p>
        )}
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-1">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <a
                  href={a.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-700 hover:underline"
                  title={a.filename}
                >
                  {a.filename}
                </a>
                <div className="ml-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>{(a.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(a.id)}
                    className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                    aria-label={`刪除 ${a.filename}`}
                  >
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ExternalLinkButton({
  href,
  label,
  coverage,
  platform,
}: {
  href: string;
  label: string;
  coverage: 'full' | 'city-only' | 'platform-home';
  platform: ExternalPlatformId;
}) {
  const coverageHint =
    coverage === 'platform-home'
      ? '（縣市未覆蓋，導向首頁）'
      : coverage === 'city-only'
        ? '（縣市層）'
        : '';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition"
      data-platform={platform}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
      <span>{label}</span>
      {coverageHint && (
        <span className="text-xs text-amber-600">{coverageHint}</span>
      )}
    </a>
  );
}
