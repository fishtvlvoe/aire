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
import { formatLabelWithUnit } from "@/lib/property-types/units";
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
import PhotoUploadClassifier from "@/components/PhotoUploadClassifier";
import LayoutSelector, { type LayoutValue } from "@/components/LayoutSelector";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import ExtractProgress, {
  type ExtractProgressProps,
} from "@/components/ui/ExtractProgress";
import type { FieldWithProvenance } from "@/lib/ocr";

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
  /**
   * Task 4.3: OCR 合併欄位資料（含 provenance），用於顯示來源徽章
   * key 對應 field.key
   */
  mergedFields?: Record<string, FieldWithProvenance>;
  /**
   * Task 4.6: 目前章節的 OCR 解析進度，用於顯示在章節標題旁
   */
  extractProgress?: Pick<ExtractProgressProps, "status" | "progress">;
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

    // nested object/array 跳過不納入（避免污染表單字串狀態）
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
      onNavigationStateChange,
      actionButtons,
      mergedFields,
      extractProgress,
    },
    ref,
  ) {
    const [internalType, setInternalType] = useState<PropertyType>("apartment");
    const activeType: PropertyType = propPropertyType ?? internalType;

    // Decision A: 使用 normalizeInitialData 初始化表單
    const [form, setForm] = useState<Record<string, string>>(() =>
      normalizeInitialData(initialData),
    );
    // 新物件（無 initialData）預設從照片/文件章節開始，
    // 既有物件（已有 field_visit_data）維持從基本資訊開始，向下相容
    const [activeChapterId, setActiveChapterId] = useState<ChapterId>(
      initialData ? "basic" : "media",
    );

    // Decision A: 追蹤是否已經水合過初始資料
    const didHydrateRef = useRef(false);


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
        // 物件類型切換時，重置到第一章（照片/文件）
        setActiveChapterId("media");
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

      // Wave 1: extra keys stored outside schema fields
      const extraNumberKeys = ["floor_current", "floor_total"] as const;
      for (const key of extraNumberKeys) {
        const raw = form[key] ?? "";
        formData[key] = raw === "" ? null : Number(raw);
      }

      const extraTextKeys = [
        "utility_type",
        "utility_other",
        "utility_notes",
      ] as const;
      for (const key of extraTextKeys) {
        formData[key] = (form[key] ?? "").trim();
      }

      onSave(formData, isComplete);
    }, [activeType, allFields, form, isComplete, onSave]);

    const updateField = (key: string, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

    const renderField = (field: FieldSchema) => {
      const value = form[field.key] ?? "";
      const labelWithUnit = formatLabelWithUnit(field.label, field.key);
      const labelText = `${labelWithUnit}${field.required ? " *" : ""}`;
      const modeClassName = getDisplayModeClassName(field);
      const helperText = getDisplayModeHelper(field);
      const placeholder =
        field.displayMode === "blank" ? "" : `請輸入${field.label}`;

      // Decision C: 檢查是否需要高亮顯示必填未填欄位
      const isRequiredMissing =
        highlightMissing && field.required && value.trim() === "";
      const highlightClassName = isRequiredMissing
        ? "border-red-500 ring-1 ring-red-500"
        : "";

      // Task 4.3: 取得此欄位的 provenance 資料，用於渲染來源徽章
      const fieldProvenance = mergedFields?.[field.key];
      const provenanceBadge = fieldProvenance ? (
        <ProvenanceBadge
          provenance={fieldProvenance.provenance}
          confidence={fieldProvenance.confidence}
        />
      ) : null;

      // 欄位標籤列（label 文字 + provenance 徽章）
      const labelRow = (
        <span className="flex items-center gap-1.5">
          <span>{labelText}</span>
          {provenanceBadge}
        </span>
      );

      if (field.key === "usage") {
        const utilityType = form.utility_type ?? "";
        const utilityOther = form.utility_other ?? "";
        const utilityNotes = form.utility_notes ?? "";

        return (
          <div key={field.key} className="block text-sm font-medium text-slate-700">
            <p className="flex items-center gap-1.5">{labelRow}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
              {["獨立電表", "共用電表", "其他"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="utility_type"
                    value={opt}
                    checked={utilityType === opt}
                    onChange={() => {
                      updateField("utility_type", opt);
                      if (opt !== "其他") updateField("utility_other", "");
                    }}
                    className="h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {utilityType === "其他" && (
              <input
                type="text"
                value={utilityOther}
                onChange={(e) => updateField("utility_other", e.target.value)}
                className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
                placeholder="請輸入其他水電類型"
              />
            )}

            <label className="mt-3 block text-sm font-medium text-slate-700">
              備註（選填）
              <textarea
                value={utilityNotes}
                onChange={(e) => updateField("utility_notes", e.target.value)}
                className={`${inputClassName} min-h-24 resize-y ${modeClassName} ${highlightClassName}`}
                placeholder=""
              />
            </label>
          </div>
        );
      }

      if (field.key === "layout") {
        let parsed: LayoutValue = { rooms: 0, halls: 0, baths: 0, kitchens: 0 };
        try {
          const raw = form.layout ?? "";
          if (raw.trim() !== "") {
            const v = JSON.parse(raw) as unknown;
            if (typeof v === "object" && v !== null) {
              const obj = v as Partial<LayoutValue>;
              parsed = {
                rooms: typeof obj.rooms === "number" ? obj.rooms : 0,
                halls: typeof obj.halls === "number" ? obj.halls : 0,
                baths: typeof obj.baths === "number" ? obj.baths : 0,
                kitchens: typeof obj.kitchens === "number" ? obj.kitchens : 0,
              };
            }
          }
        } catch {
          parsed = { rooms: 0, halls: 0, baths: 0, kitchens: 0 };
        }

        return (
          <div key={field.key} className="block text-sm font-medium text-slate-700">
            <label className="flex items-center gap-1.5">{labelRow}</label>
            <div className="mt-2">
              <LayoutSelector
                value={parsed}
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, layout: JSON.stringify(v) }));
                }}
              />
            </div>
          </div>
        );
      }

      if (field.key === "floor_count") {
        const current = form.floor_current ?? "";
        const total = form.floor_total ?? "";
        const currentNum = Number.parseInt(current || "0", 10);
        const totalNum = Number.parseInt(total || "0", 10);
        const isInvalid = totalNum > 0 && currentNum > totalNum;

        return (
          <div key={field.key} className="block text-sm font-medium text-slate-700">
            <label className="flex items-center gap-1.5">{labelRow}</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">
                所在樓層
                <input
                  type="number"
                  value={current}
                  min={0}
                  onChange={(e) => updateField("floor_current", e.target.value)}
                  className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                總樓層
                <input
                  type="number"
                  value={total}
                  min={0}
                  onChange={(e) => updateField("floor_total", e.target.value)}
                  className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {currentNum || 0} / {totalNum || 0} 樓
            </p>
            {isInvalid && (
              <p className="mt-1 text-sm text-red-600">所在樓層不可超過總樓層</p>
            )}
          </div>
        );
      }

      if (field.key === "year_built") {
        const yearLabel = `建築完成年份（民國）${field.required ? " *" : ""}`;
        const rocYear = new Date().getFullYear() - 1911;
        const built = Number.parseInt(form.year_built || "0", 10);
        const age = rocYear - built;
        const showAge = built > 0 && Number.isFinite(age) && age >= 0;

        return (
          <div key={field.key} className="block text-sm font-medium text-slate-700">
            <label className="block text-sm font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>{yearLabel}</span>
                {provenanceBadge}
              </span>
              <input
                type="number"
                value={form.year_built ?? ""}
                onChange={(e) => updateField("year_built", e.target.value)}
                className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
                placeholder=""
                required={field.required}
              />
            </label>
            {showAge && (
              <p className="mt-1 text-sm text-slate-600">屋齡：{age} 年</p>
            )}
          </div>
        );
      }

      // 特殊處理照片欄位
      if (field.key === "photos") {
        return (
          <div
            key={field.key}
            className="block text-sm font-medium text-slate-700"
          >
            <label className="flex items-center gap-1.5">{labelRow}</label>
            <div className="mt-2">
              <PhotoUploadClassifier
                files={[]}
                onClassified={(result) => {
                  setForm((prev) => ({
                    ...prev,
                    photos: JSON.stringify(result),
                  }));
                }}
              />
            </div>
            {helperText ? (
              <p className="mt-1 text-xs text-amber-700">{helperText}</p>
            ) : null}
            {isRequiredMissing && (
              <p className="mt-1 text-xs text-red-600">此欄位必填</p>
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
            {labelRow}
            <select
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              className={`${inputClassName} ${modeClassName} ${highlightClassName}`}
              required={field.required}
            >
              <option value="">請選擇</option>
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
            {labelRow}
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
            {labelRow}
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
          {labelRow}
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
          {/* 章節標題列：標題左邊、跳過按鈕右邊（照片/文件章節限定） */}
          <div className="flex items-center justify-between">
            {/* Task 4.6: 標題 + OCR 解析進度指示 */}
            <h3 className="flex items-center text-base font-semibold text-slate-900">
              {activeChapter?.title}
              {extractProgress && (
                <ExtractProgress
                  status={extractProgress.status}
                  progress={extractProgress.progress}
                />
              )}
            </h3>
            {/* 照片/文件章節且尚未有上傳檔案時，顯示跳過按鈕 */}
            {activeChapterId === "media" && !(form.photos ?? "").trim() && (
              <button
                type="button"
                onClick={goToNextChapter}
                className="text-sm text-slate-500 underline hover:text-slate-700 transition-colors"
              >
                跳過上傳，全部手動輸入
              </button>
            )}
          </div>
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
