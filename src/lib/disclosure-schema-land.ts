/**
 * 土地說明書表單 schema（依 SDD spec disclosure-form-land）
 *
 * 對應 AIRE Phase 1 Group 7.1。
 * 提供欄位定義、zod 驗證、預設值、tri-state boolean 處理。
 */

import { z } from "zod";

/** Tri-state boolean：true / false / unknown */
export const TriState = z.enum(["true", "false", "unknown"]);
export type TriStateValue = z.infer<typeof TriState>;

/** 正數含小數點最多 2 位 */
const PositiveDecimal = z
  .number()
  .nonnegative({ message: "不可為負數" })
  .refine((n) => Number(n.toFixed(2)) === n, {
    message: "小數最多 2 位",
  });

/** 持分比例 0-1 */
const ShareRatio = z
  .number()
  .min(0, { message: "持分比例需介於 0 到 1" })
  .max(1, { message: "持分比例需介於 0 到 1" });

/**
 * 土地說明書欄位 schema。
 * - draft 階段：所有欄位皆 optional
 * - completed 階段：用 `landSchemaCompleted` 驗證必填
 */
export const landSchema = z.object({
  // === 標示（identification）tab ===
  land_lot_no: z.string().optional(),
  land_area: PositiveDecimal.optional(),
  zoning_use: z.string().optional(),
  urban_district: z.string().optional(),
  land_category: z.string().optional(),

  // === 權利（rights）tab ===
  ownership_type: z.string().optional(),
  share_ratio: ShareRatio.optional(),
  mortgage_status: z.string().optional(),
  other_rights: z.string().optional(),

  // === 稅費（tax & fees）tab ===
  tax_land_value: PositiveDecimal.optional(),
  tax_announced_present_value: PositiveDecimal.optional(),
  tax_land_value_tax_annual: PositiveDecimal.optional(),

  // === 現況（current condition）tab ===
  condition_access: TriState.optional(),
  condition_boundary_clear: TriState.optional(),
  condition_tenant_present: TriState.optional(),
  condition_defects_notes: z.string().optional(),
});

export type LandPayload = z.infer<typeof landSchema>;

/**
 * 標示為「completed」狀態時必填的欄位。
 * 對應 spec：「Text field land_lot_no MUST NOT be empty for status=completed transition」
 */
export const landSchemaCompleted = landSchema.extend({
  land_lot_no: z.string().min(1, { message: "地號為必填" }),
  address: z.string().min(1, { message: "地址為必填" }),
});

/**
 * 表單 tab 結構，給 UI 元件迭代用。
 */
export interface FormFieldDef {
  key: keyof LandPayload | string;
  label: string;
  type: "text" | "number" | "tristate" | "textarea";
  placeholder?: string;
  required?: boolean;
}

export interface FormTab {
  id: string;
  label: string;
  fields: FormFieldDef[];
}

/** 4 個 tab 的土地表單結構 */
export const landFormTabs: FormTab[] = [
  {
    id: "identification",
    label: "標示",
    fields: [
      { key: "land_lot_no", label: "地號", type: "text", required: true },
      { key: "land_area", label: "土地面積（平方公尺）", type: "number" },
      { key: "zoning_use", label: "使用分區", type: "text" },
      { key: "urban_district", label: "都市計畫區", type: "text" },
      { key: "land_category", label: "土地分類", type: "text" },
    ],
  },
  {
    id: "rights",
    label: "權利",
    fields: [
      { key: "ownership_type", label: "所有權型態", type: "text" },
      { key: "share_ratio", label: "持分比例（0 到 1）", type: "number" },
      { key: "mortgage_status", label: "抵押權狀態", type: "text" },
      { key: "other_rights", label: "其他權利", type: "textarea" },
    ],
  },
  {
    id: "tax",
    label: "稅費",
    fields: [
      { key: "tax_land_value", label: "土地公告現值（元）", type: "number" },
      {
        key: "tax_announced_present_value",
        label: "公告現值（元/平方公尺）",
        type: "number",
      },
      { key: "tax_land_value_tax_annual", label: "年度地價稅（元）", type: "number" },
    ],
  },
  {
    id: "condition",
    label: "現況",
    fields: [
      { key: "condition_access", label: "通行情形正常", type: "tristate" },
      { key: "condition_boundary_clear", label: "界址清楚", type: "tristate" },
      { key: "condition_tenant_present", label: "現有承租人", type: "tristate" },
      { key: "condition_defects_notes", label: "瑕疵備註", type: "textarea" },
    ],
  },
];

/** 預設值（draft 開新案件時用） */
export const landDefaults: LandPayload = {
  land_lot_no: "",
  zoning_use: "",
  urban_district: "",
  land_category: "",
  ownership_type: "",
  mortgage_status: "",
  other_rights: "",
  condition_access: "unknown",
  condition_boundary_clear: "unknown",
  condition_tenant_present: "unknown",
  condition_defects_notes: "",
};
