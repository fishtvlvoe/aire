"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PropertyType } from "@/lib/property-types";
import { PROPERTY_TYPES } from "@/lib/property-types";
import {
  type ChapterId,
  type FieldSchema,
  type FullSchema,
  groupFieldsByChapter,
} from "@/lib/form-renderer/chapter-grouper";
import {
  apartmentSchema,
  commercialLandSchema,
  factorySchema,
  farmhouseSchema,
  farmlandSchema,
  highriseSchema,
  industrialLandSchema,
  otherLandSchema,
  residentialLandSchema,
  ruralLandSchema,
  shopSchema,
  suiteSchema,
  townhouseSchema,
} from "@/lib/property-types/schemas";
import {
  findNextNonEmptyChapterId,
  hasNextNonEmptyChapter,
} from "./navigation-helpers";

const SCHEMA_MAP: Record<PropertyType, FullSchema> = {
  apartment: apartmentSchema,
  highrise: highriseSchema,
  townhouse: townhouseSchema,
  suite: suiteSchema,
  shop: shopSchema,
  factory: factorySchema,
  farmhouse: farmhouseSchema,
  farmland: farmlandSchema,
  "residential-land": residentialLandSchema,
  "industrial-land": industrialLandSchema,
  "commercial-land": commercialLandSchema,
  "rural-land": ruralLandSchema,
  "other-land": otherLandSchema,
};

export type NavigationState = {
  currentChapterId: string;
  hasNextChapter: boolean;
  isCurrentChapterComplete: boolean;
  isComplete: boolean;
};

export type FieldVisitFormHandle = {
  goToNextChapter: () => void;
};

export type FieldVisitFormProps = {
  onSave: (formData: Record<string, unknown>, isComplete: boolean) => void;
  /** When provided, the property-type selector is hidden and this value is used */
  propertyType?: PropertyType;
  /** Decision A: 支援回填的初始資料 */
  initialData?: Record<string, unknown>;
  /** Decision C: 是否高亮顯示必填未填欄位 */
  highlightMissing?: boolean;
  /** Decision C: 跳轉到指定章節的回調 */
  onJumpTo?: (chapterId: string) => void;
  /** 可選的 listing ID，用於照片上傳 */
  listingId?: number;
  /** 導航狀態變更回調 */
  onNavigationStateChange?: (state: NavigationState) => void;
  /** 渲染在表單白框右上角的操作按鈕 */
  actionButtons?: React.ReactNode;
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-base leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

const getDisplayModeClassName = (field: FieldSchema): string => {
  if (field.displayMode === "estimate") {
    return "border-amber-300 bg-amber-50";
  }

  if (field.displayMode === "blank") {
    return "border-slate-300 bg-slate-100";
  }

  return "bg-white";
};

const getDisplayModeHelper = (field: FieldSchema): string | null => {
  if (field.displayMode === "estimate") {
    return "估算值";
  }

  return null;
};

// Decision A: 正規化初始資料，將各種值轉為字串格式
export const normalizeInitialData = (
  data: Record<string, unknown> | undefined,
): Record<string, string> => {
  if (!data) return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    // null 或 undefined 轉空字串
    if (value == null) {
      result[key] = "";
      continue;
    }

    // object 或 array 跳過不納入
    if (typeof value === "object") {
      continue;
    }

    // 其他值用 String() 轉字串
    result[key] = String(value);
  }

  return result;
};

// Decision B: 新的章節 badge 樣式函數，三色系統
export const getChapterBadgeClassName = (
  filledRequired: number,
  totalRequired: number,
  filledAll: number,
  totalAll: number,
): string => {
  // 必填未完成：灰色（會加紅點）
  if (filledRequired < totalRequired) {
    return "bg-slate-100 text-slate-600";
  }

  // 必填完成但總欄位未完成：琥珀色
  if (filledRequired === totalRequired && filledAll < totalAll) {
    return "bg-amber-100 text-amber-700";
  }

  // 全部完成：綠色
  if (filledAll === totalAll && totalAll > 0) {
    return "bg-emerald-100 text-emerald-700";
  }

  // 其他情況（total=0 或 empty）：灰色
  return "bg-slate-100 text-slate-600";
};

// Decision B: 是否顯示必填紅點指示器
export const shouldShowRequiredDot = (
  filledRequired: number,
  totalRequired: number,
): boolean => {
  return filledRequired < totalRequired;
};

const FieldVisitForm = forwardRef<FieldVisitFormHandle, FieldVisitFormProps>(
  function FieldVisitForm(
    {
      onSave,
      propertyType: propPropertyType,
      initialData,
      highlightMissing = false,
      onJumpTo,
      listingId,
      onNavigationStateChange,
      actionButtons,
    },
    ref,
  ) {
    const [internalType, setInternalType] = useState<PropertyType>("apartment");
    const activeType: PropertyType = propPropertyType ?? internalType;

    // Decision A: 使用 normalizeInitialData 初始化表單
    const [form, setForm] = useState<Record<string, string>>(() =>
      normalizeInitialData(initialData),
    );
    const [activeChapterId, setActiveChapterId] = useState<ChapterId>("basic");

    // Decision A: 追蹤是否已經水合過初始資料
    const didHydrateRef = useRef(false);

    // 照片上傳狀態
    const [uploading, setUploading] = useState(false);

    const schema = SCHEMA_MAP[activeType];
    const chapters = useMemo(
      () => groupFieldsByChapter(schema, activeType),
      [activeType, schema],
    );
    const nonEmptyChapters = useMemo(
      () => chapters.filter((c) => c.fields.length > 0),
      [chapters],
    );
    const allFields = useMemo(
      () => chapters.flatMap((chapter) => chapter.fields),
      [chapters],
    );
    const activeChapter = useMemo(
      () =>
        chapters.find((chapter) => chapter.id === activeChapterId) ??
        chapters[0],
      [activeChapterId, chapters],
    );
    // Decision B: 修改完成度計算，新增 filledAll 與 totalAll 欄位
    const chapterCompletion = useMemo(
      () =>
        chapters.map((chapter) => {
          const requiredFields = chapter.fields.filter(
            (field) => field.required,
          );
          const allFields = chapter.fields;
          const totalRequired = requiredFields.length;
          const totalAll = allFields.length;
          const filledRequired = requiredFields.filter(
            (field) => (form[field.key] ?? "").trim() !== "",
          ).length;
          const filledAll = allFields.filter(
            (field) => (form[field.key] ?? "").trim() !== "",
          ).length;
          return {
            chapterId: chapter.id,
            totalRequired,
            filledRequired,
            totalAll,
            filledAll,
          };
        }),
      [chapters, form],
    );

    // Decision A: initialData 水合邏輯
    useEffect(() => {
      // 若已經水合過，直接返回
      if (didHydrateRef.current === true) return;

      // 若沒有初始資料，直接返回
      if (initialData === undefined) return;

      // 執行水合並標記已完成
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 此為 prop 變化後一次性 hydrate，無法避免 setState。
      setForm(normalizeInitialData(initialData));
      didHydrateRef.current = true;
    }, [initialData]);

    // Reset form values and tab when property type changes
    // Decision A: 僅在 propPropertyType === undefined 時才清空表單
    useEffect(() => {
      if (propPropertyType === undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({});
        setActiveChapterId("basic");
      }
    }, [activeType, propPropertyType]);

    const isComplete = useMemo(() => {
      const required = allFields.filter((f) => f.required);
      return required.every((f) => {
        const val = form[f.key] ?? "";
        return val.trim() !== "";
      });
    }, [allFields, form]);

    // Navigation state calculation
    const navigationState = useMemo(() => {
      const hasNextChapter = hasNextNonEmptyChapter(chapters, activeChapterId);

      // Check if current chapter is complete
      const currentChapter = chapters.find((c) => c.id === activeChapterId);
      const isCurrentChapterComplete = currentChapter
        ? currentChapter.fields
            .filter((f) => f.required)
            .every((f) => (form[f.key] ?? "").trim() !== "")
        : false;

      return {
        currentChapterId: activeChapterId,
        hasNextChapter,
        isCurrentChapterComplete,
        isComplete,
      };
    }, [chapters, activeChapterId, form, isComplete]);

    // goToNextChapter function
    const goToNextChapter = () => {
      const nextChapterId = findNextNonEmptyChapterId(
        chapters,
        activeChapterId,
      );
      if (!nextChapterId) return;

      setActiveChapterId(nextChapterId as ChapterId);
      onJumpTo?.(nextChapterId);
      // 等 React re-render 完再捲，避免新章節內容撐開頁面後位置又跑掉
      setTimeout(() => {
        document
          .getElementById("field-visit-form-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    };

    useImperativeHandle(ref, () => ({
      goToNextChapter,
    }));

    // Notify parent about navigation state changes
    useEffect(() => {
      onNavigationStateChange?.(navigationState);
    }, [onNavigationStateChange, navigationState]);

    useEffect(() => {
      const formData: Record<string, unknown> = { property_type: activeType };
      for (const field of allFields) {
        const raw = form[field.key] ?? "";
        if (field.type === "number") {
          formData[field.key] = raw === "" ? null : Number(raw);
        } else {
          formData[field.key] = raw.trim();
        }
      }
      onSave(formData, isComplete);
    }, [activeType, allFields, form, isComplete, onSave]);

    const updateField = (key: string, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

    const renderField = (field: FieldSchema) => {
      const value = form[field.key] ?? "";
      const labelText = `${field.label}${field.required ? " *" : ""}`;
      const modeClassName = getDisplayModeClassName(field);
      const helperText = getDisplayModeHelper(field);
      const placeholder =
        field.displayMode === "blank" ? "秘書後補" : `請輸入${field.label}`;

      // Decision C: 檢查是否需要高亮顯示必填未填欄位
      const isRequiredMissing =
        highlightMissing && field.required && value.trim() === "";
      const highlightClassName = isRequiredMissing
        ? "border-red-500 ring-1 ring-red-500"
        : "";

      // 特殊處理照片欄位
      if (field.key === "photos") {
        const handlePhotoUpload = async (
          e: React.ChangeEvent<HTMLInputElement>,
        ) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length === 0 || listingId === undefined) return;

          setUploading(true);
          try {
            const formData = new FormData();
            files.forEach((f) => formData.append("photo", f));

            const res = await fetch(`/api/listings/${listingId}/photos`, {
              method: "POST",
              body: formData,
            });
            const { filenames } = await res.json();

            // 解析當前 photos 狀態
            let existing: string[] = [];
            try {
              if (form.photos && form.photos.trim() !== "") {
                existing = JSON.parse(form.photos);
                if (!Array.isArray(existing)) {
                  existing = [];
                }
              }
            } catch {
              existing = [];
            }

            const merged = [...existing, ...filenames];
            setForm((prev) => ({ ...prev, photos: JSON.stringify(merged) }));
          } catch (error) {
            console.error("上傳失敗:", error);
          } finally {
            setUploading(false);
          }
        };

        const removePhoto = (filenameToRemove: string) => {
          let existing: string[] = [];
          try {
            if (form.photos && form.photos.trim() !== "") {
              existing = JSON.parse(form.photos);
              if (!Array.isArray(existing)) {
                existing = [];
              }
            }
          } catch {
            existing = [];
          }

          const filtered = existing.filter(
            (filename) => filename !== filenameToRemove,
          );
          setForm((prev) => ({ ...prev, photos: JSON.stringify(filtered) }));
        };

        // 取得現有照片列表
        let existingPhotos: string[] = [];
        try {
          if (form.photos && form.photos.trim() !== "") {
            existingPhotos = JSON.parse(form.photos);
            if (!Array.isArray(existingPhotos)) {
              existingPhotos = [];
            }
          }
        } catch {
          existingPhotos = [];
        }

        return (
          <div
            key={field.key}
            className="block text-sm font-medium text-slate-700"
          >
            <label>{labelText}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading || listingId === undefined}
              className={`${inputClassName} ${modeClassName} ${highlightClassName} disabled:opacity-50`}
            />
            {uploading && (
              <p className="mt-1 text-xs text-blue-600">上傳中...</p>
            )}
            {listingId === undefined && (
              <p className="mt-1 text-xs text-slate-500">
                需要 listing ID 才能上傳照片
              </p>
            )}
            {helperText ? (
              <p className="mt-1 text-xs text-amber-700">{helperText}</p>
            ) : null}
            {isRequiredMissing && (
              <p className="mt-1 text-xs text-red-600">此欄位必填</p>
            )}

            {/* 顯示現有照片 */}
            {existingPhotos.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-600">已上傳的照片：</p>
                {existingPhotos.map((filename, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs"
                  >
                    <span className="text-slate-700">{filename}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(filename)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (field.type === "select" && field.options) {
        return (
          <label
            key={field.key}
            className="block text-sm font-medium text-slate-700"
          >
            {labelText}
            <select
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
              required={field.required}
            >
              <option value="">
                {field.displayMode === "blank" ? "秘書後補" : "請選擇"}
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {helperText ? (
              <p className="mt-1 text-xs text-amber-700">{helperText}</p>
            ) : null}
            {/* Decision C: 必填欄位未填時顯示錯誤提示 */}
            {isRequiredMissing && (
              <p className="mt-1 text-xs text-red-600">此欄位必填</p>
            )}
          </label>
        );
      }

      if (field.type === "textarea") {
        return (
          <label
            key={field.key}
            className="block text-sm font-medium text-slate-700"
          >
            {labelText}
            <textarea
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              className={`${inputClassName} min-h-28 resize-y ${modeClassName} ${highlightClassName}`}
              placeholder={placeholder}
              required={field.required}
            />
            {helperText ? (
              <p className="mt-1 text-xs text-amber-700">{helperText}</p>
            ) : null}
            {/* Decision C: 必填欄位未填時顯示錯誤提示 */}
            {isRequiredMissing && (
              <p className="mt-1 text-xs text-red-600">此欄位必填</p>
            )}
          </label>
        );
      }

      if (field.type === "file") {
        return (
          <label
            key={field.key}
            className="block text-sm font-medium text-slate-700"
          >
            {labelText}
            <input
              type="file"
              onChange={(e) => {
                const files = e.target.files
                  ? Array.from(e.target.files).map((file) => file.name)
                  : [];
                updateField(field.key, files.join(", "));
              }}
              className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
              required={field.required}
            />
            {helperText ? (
              <p className="mt-1 text-xs text-amber-700">{helperText}</p>
            ) : null}
            {/* Decision C: 必填欄位未填時顯示錯誤提示 */}
            {isRequiredMissing && (
              <p className="mt-1 text-xs text-red-600">此欄位必填</p>
            )}
          </label>
        );
      }

      return (
        <label
          key={field.key}
          className="block text-sm font-medium text-slate-700"
        >
          {labelText}
          <input
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
            placeholder={placeholder}
            required={field.required}
          />
          {helperText ? (
            <p className="mt-1 text-xs text-amber-700">{helperText}</p>
          ) : null}
          {/* Decision C: 必填欄位未填時顯示錯誤提示 */}
          {isRequiredMissing && (
            <p className="mt-1 text-xs text-red-600">此欄位必填</p>
          )}
        </label>
      );
    };

    return (
      <section id="field-visit-form-section" className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">現勘表單</h2>
          <p className="mt-1 text-sm text-slate-600">
            請先選擇物件類型，再填寫對應欄位。
          </p>
        </div>

        {/* Property type selector — only shown when not controlled externally */}
        {propPropertyType === undefined && (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700">物件類型</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((type) => {
                const info = PROPERTY_TYPES[type];
                return (
                  <label key={type} className="cursor-pointer">
                    <input
                      type="radio"
                      name="field_visit_property_type"
                      value={type}
                      checked={internalType === type}
                      onChange={() => setInternalType(type)}
                      className="sr-only"
                    />
                    <span
                      className={`flex min-h-12 items-center justify-center rounded-lg border px-2 py-2 text-sm ${
                        internalType === type
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {info.displayName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-sm font-medium text-slate-700">章節導覽</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chapters
              .filter((chapter) => chapter.fields.length > 0)
              .map((chapter) => {
                const progress = chapterCompletion.find(
                  (item) => item.chapterId === chapter.id,
                );
                const filledRequired = progress?.filledRequired ?? 0;
                const totalRequired = progress?.totalRequired ?? 0;
                const filledAll = progress?.filledAll ?? 0;
                const totalAll = progress?.totalAll ?? 0;
                const isActive = activeChapter?.id === chapter.id;

                // Decision B: 使用新的 badge 樣式函數和紅點指示器
                const badgeClassName = getChapterBadgeClassName(
                  filledRequired,
                  totalRequired,
                  filledAll,
                  totalAll,
                );
                const showRequiredDot = shouldShowRequiredDot(
                  filledRequired,
                  totalRequired,
                );

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => {
                      setActiveChapterId(chapter.id);
                      // Decision C: 如果有 onJumpTo 回調，執行它
                      onJumpTo?.(chapter.id);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{chapter.title}</span>
                    {/* Decision B: Badge 改為顯示已填/總欄，並加上必填紅點 */}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${badgeClassName} ${showRequiredDot ? "relative" : ""}`}
                    >
                      {filledAll}/{totalAll}
                      {/* Decision B: 必填紅點指示器 */}
                      {showRequiredDot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            {activeChapter?.title}
          </h3>
          {(activeChapter?.fields.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500">此章節目前沒有欄位。</p>
          ) : (
            activeChapter.fields.map(renderField)
          )}
        </div>

        {actionButtons && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            {actionButtons}
          </div>
        )}
      </section>
    );
  },
);

export default FieldVisitForm;
