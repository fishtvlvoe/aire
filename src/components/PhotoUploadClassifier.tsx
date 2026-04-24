"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// 型別定義
export type PhotoCategory =
  | "interior"
  | "exterior"
  | "street-view"
  | "advantage"
  | "other"
  | "transcript"
  | "land-title"
  | "contract"
  | "cadastral-map";

export type ClassifiedFile = {
  filename: string;
  originalName: string;
  category: PhotoCategory;
  uploadedAt: string;
};

export type PhotoUploadClassifierProps = {
  files: File[];
  onClassified: (result: ClassifiedFile[]) => void;
};

const CATEGORY_OPTIONS: Array<{ value: PhotoCategory; label: string }> = [
  { value: "interior", label: "室內" },
  { value: "exterior", label: "外觀" },
  { value: "street-view", label: "街景" },
  { value: "advantage", label: "優勢" },
  { value: "transcript", label: "謄本" },
  { value: "land-title", label: "權狀" },
  { value: "contract", label: "合約" },
  { value: "cadastral-map", label: "地籍" },
  { value: "other", label: "其他" },
];

const classifyByFilename = (name: string): PhotoCategory => {
  const n = name.toLowerCase();
  // 中文 / 簡體 / 英文 關鍵字皆支援，避免「陳世曉-謄本.pdf」這種純中文檔名落空
  if (n.includes("interior") || n.includes("室內") || n.includes("室内") || n.includes("內部") || n.includes("内部")) return "interior";
  if (n.includes("exterior") || n.includes("外觀") || n.includes("外观") || n.includes("外部")) return "exterior";
  if (n.includes("street-view") || n.includes("streetview") || n.includes("街景")) return "street-view";
  if (n.includes("advantage") || n.includes("優勢") || n.includes("优势") || n.includes("亮點") || n.includes("亮点")) return "advantage";
  if (n.includes("transcript") || n.includes("謄本") || n.includes("誊本") || n.includes("登記簿") || n.includes("登记簿")) return "transcript";
  if (n.includes("land-title") || n.includes("landtitle") || n.includes("權狀") || n.includes("权状")) return "land-title";
  if (n.includes("contract") || n.includes("contract") || n.includes("合約") || n.includes("合约") || n.includes("契約") || n.includes("契约")) return "contract";
  if (n.includes("cadastral-map") || n.includes("cadastral") || n.includes("地籍")) return "cadastral-map";
  return "other";
};

type LocalItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  category: PhotoCategory | null;
  suggested: PhotoCategory;
  uploadedAt: string;
};

const buildId = (file: File): string => {
  // stable enough for UI usage, also helps avoid duplicate "filename"
  return `${file.name}-${file.size}-${file.lastModified}`;
};

const isImageFile = (file: File): boolean => file.type.startsWith("image/");

const toFilename = (item: LocalItem): string => {
  // Keep a deterministic unique name for later referencing/removal.
  return `${item.id}`;
};

export default function PhotoUploadClassifier({ files, onClassified }: PhotoUploadClassifierProps) {
  const [items, setItems] = useState<LocalItem[]>(() => {
    const now = new Date().toISOString();
    return files.map((file) => {
      const suggested = classifyByFilename(file.name);
      return {
        id: buildId(file),
        file,
        previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
        category: suggested === "other" ? null : suggested,
        suggested,
        uploadedAt: now,
      };
    });
  });

  const objectUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    for (const item of items) {
      if (item.previewUrl) objectUrlsRef.current.add(item.previewUrl);
    }
  }, [items]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  const unclassifiedQueue = useMemo(() => items.filter((i) => i.category === null), [items]);
  const classified = useMemo(() => items.filter((i) => i.category !== null), [items]);

  // Stabilize onClassified prop reference to avoid infinite loop when parent
  // recreates the callback on every render（L044 變體：useEffect 內呼叫 prop callback 觸發
  // parent setState → parent rerender → 新 callback reference → useEffect 又跑 → 無限）。
  const onClassifiedRef = useRef(onClassified);
  onClassifiedRef.current = onClassified;

  // Track last emitted signature to skip duplicate notifications.
  const lastEmittedRef = useRef<string>('');

  useEffect(() => {
    if (items.length === 0) return;
    if (unclassifiedQueue.length > 0) return;

    const result: ClassifiedFile[] = items
      .map((item) => {
        if (item.category === null) return null;
        return {
          filename: toFilename(item),
          originalName: item.file.name,
          category: item.category,
          uploadedAt: item.uploadedAt,
        };
      })
      .filter((x): x is ClassifiedFile => x !== null);

    if (result.length !== items.length) return;

    const sig = result.map((r) => `${r.filename}:${r.category}`).join('|');
    if (sig === lastEmittedRef.current) return;
    lastEmittedRef.current = sig;
    onClassifiedRef.current(result);
  }, [items, unclassifiedQueue.length]);

  const addFiles = (selected: File[]) => {
    if (selected.length === 0) return;
    const now = new Date().toISOString();

    setItems((prev) => {
      const next: LocalItem[] = [];
      for (const file of selected) {
        const id = buildId(file);
        // allow same-name files with different sizes/lastModified to coexist
        const suggested = classifyByFilename(file.name);
        next.push({
          id,
          file,
          previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
          category: suggested === "other" ? null : suggested,
          suggested,
          uploadedAt: now,
        });
      }
      return [...prev, ...next];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const setItemCategory = (id: string, category: PhotoCategory) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, category } : i)));
  };

  // 展開中的分類 bucket（點擊後才顯示該分類裡的檔案細節；其餘情境不秀檔名）
  const [expandedCategory, setExpandedCategory] = useState<PhotoCategory | null>(null);
  // 未分類佇列中需要變更檔案分類的 id
  const [changingId, setChangingId] = useState<string | null>(null);

  // 每個分類有幾筆
  const countByCategory = useMemo(() => {
    const map = new Map<PhotoCategory, number>();
    for (const item of classified) {
      if (item.category) {
        map.set(item.category, (map.get(item.category) ?? 0) + 1);
      }
    }
    return map;
  }, [classified]);

  const expandedItems = useMemo(
    () => (expandedCategory ? classified.filter((i) => i.category === expandedCategory) : []),
    [expandedCategory, classified],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">上傳照片/文件</p>
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              addFiles(selected);
              e.currentTarget.value = "";
            }}
          />
          選擇檔案
        </label>
      </div>

      {/* 分類 bucket 網格（系統自動判別結果；業務直接看聚合數量，不看檔名） */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CATEGORY_OPTIONS.map((opt) => {
            const count = countByCategory.get(opt.value) ?? 0;
            const unit = opt.value === "transcript" || opt.value === "land-title" || opt.value === "contract" || opt.value === "cadastral-map" ? "份" : "張";
            const isExpanded = expandedCategory === opt.value;
            const isEmpty = count === 0;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : isEmpty ? null : opt.value)}
                disabled={isEmpty}
                className={[
                  "rounded-lg border px-3 py-2 text-left transition",
                  isExpanded
                    ? "border-blue-500 bg-blue-50"
                    : isEmpty
                      ? "border-slate-200 bg-slate-50 text-slate-400"
                      : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50",
                ].join(" ")}
              >
                <div className="text-xs text-slate-500">{opt.label}</div>
                <div className={`mt-0.5 text-lg font-semibold ${isEmpty ? "text-slate-400" : "text-slate-800"}`}>
                  {count} <span className="text-xs font-normal text-slate-500">{unit}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 展開的分類細節（點 bucket 才顯示；僅此時才秀檔名供業務確認/移除） */}
      {expandedCategory && expandedItems.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-900">
              「{CATEGORY_OPTIONS.find((o) => o.value === expandedCategory)?.label}」分類下有 {expandedItems.length} 個檔案
            </p>
            <button
              type="button"
              onClick={() => setExpandedCategory(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              收起
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {expandedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded bg-white px-3 py-1.5 text-sm"
              >
                <span className="truncate text-slate-700">{item.file.name}</span>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs"
                    value={item.category ?? "other"}
                    onChange={(e) => setItemCategory(item.id, e.target.value as PhotoCategory)}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800"
                    onClick={() => removeItem(item.id)}
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未分類佇列：系統判別不出來時才顯示，此時需要業務看檔名挑分類 */}
      {unclassifiedQueue.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            系統判別不出 {unclassifiedQueue.length} 個檔案，請手動指定分類
          </p>

          <div className="mt-3 space-y-2">
            {unclassifiedQueue.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded bg-white px-3 py-2">
                <div className="flex w-1/2 items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded bg-slate-100">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                        PDF
                      </div>
                    )}
                  </div>
                  <p className="min-w-0 truncate text-sm text-slate-800">{item.file.name}</p>
                </div>

                <div className="flex w-1/2 items-center gap-2">
                  <select
                    className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    defaultValue={""}
                    onChange={(e) => {
                      const v = e.target.value as PhotoCategory;
                      if (!v) return;
                      setItemCategory(item.id, v);
                      setChangingId(null);
                    }}
                  >
                    <option value="">請選擇分類</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800"
                    onClick={() => removeItem(item.id)}
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* suppress unused var warning for legacy state that will be re-used in future iteration */}
      {changingId ? null : null}
    </div>
  );
}
