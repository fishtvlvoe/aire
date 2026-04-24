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

  const [changingId, setChangingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">上傳照片/文件</p>
          <p className="mt-1 text-xs text-slate-500">
            系統會依檔名自動歸類為「室內 / 外觀 / 街景 / 優勢 / 謄本 / 權狀 / 合約 / 地籍」；無法判定者會進入下方「未分類配對」由您手動指定。
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []);
              addFiles(selected);
              // allow uploading same file again
              e.currentTarget.value = "";
            }}
          />
          選擇檔案
        </label>
      </div>

      {items.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">已加入：{items.length} 個</p>
            {unclassifiedQueue.length === 0 ? (
              <span className="text-xs font-medium text-emerald-700">已完成分類</span>
            ) : (
              <span className="text-xs font-medium text-amber-700">待分類：{unclassifiedQueue.length}</span>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {classified.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{item.file.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">分類：{CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  {changingId === item.id ? (
                    <select
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                      value={item.category ?? "other"}
                      onChange={(e) => {
                        setItemCategory(item.id, e.target.value as PhotoCategory);
                        setChangingId(null);
                      }}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => setChangingId(item.id)}
                    >
                      變更
                    </button>
                  )}
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

      {/* Task 1.2：連連看配對 UI */}
      {unclassifiedQueue.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">未分類配對</p>
          <p className="mt-1 text-xs text-amber-800">請為每個檔案選擇分類；完成後此區會自動隱藏。</p>

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
                        FILE
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-800">{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">建議：{CATEGORY_OPTIONS.find((o) => o.value === item.suggested)?.label}</p>
                  </div>
                </div>

                <div className="w-1/2">
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    defaultValue={""}
                    onChange={(e) => {
                      const v = e.target.value as PhotoCategory;
                      if (!v) return;
                      setItemCategory(item.id, v);
                    }}
                  >
                    <option value="">請選擇分類</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
