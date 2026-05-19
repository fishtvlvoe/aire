/**
 * 成屋說明書表單 schema（依 SDD spec disclosure-form-residential）
 *
 * 對應 AIRE Phase 1 Group 6.1。
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

/**
 * 成屋說明書欄位 schema。
 * - draft 階段：所有欄位皆 optional（允許邊填邊存）
 * - completed 階段：用 `residentialSchemaCompleted` 驗證必填
 */
export const residentialSchema = z.object({
  // === 標示（identification）tab ===
  building_lot_no: z.string().optional(),
  land_lot_no: z.string().optional(),
  floor_area: PositiveDecimal.optional(),
  building_age: PositiveDecimal.optional(),
  building_structure: z.string().optional(),
  floor_total: z.number().int().positive().optional(),
  floor_this: z.number().int().positive().optional(),

  // === 權利（rights）tab ===
  ownership_type: z.string().optional(),
  mortgage_status: z.string().optional(),
  other_rights: z.string().optional(),

  // === 稅費（tax & fees）tab ===
  tax_land_value: PositiveDecimal.optional(),
  tax_building_value: PositiveDecimal.optional(),
  tax_property_tax_annual: PositiveDecimal.optional(),
  tax_land_value_tax_annual: PositiveDecimal.optional(),

  // === 現況（current condition）tab ===
  condition_leakage: TriState.optional(),
  condition_renovation: TriState.optional(),
  condition_illegal_addition: TriState.optional(),
  condition_defects_notes: z.string().optional(),

  // === 附件（attachments）tab ===
  attachment_property_deed: TriState.optional(),
  attachment_floor_plan: TriState.optional(),
  attachment_photos_notes: z.string().optional(),
});

export type ResidentialPayload = z.infer<typeof residentialSchema>;

/**
 * 標示為「completed」狀態時必填的欄位。
 * 對應 spec：「Text fields building_lot_no, land_lot_no MUST NOT be empty for status=completed transition」
 */
export const residentialSchemaCompleted = residentialSchema.extend({
  building_lot_no: z.string().min(1, { message: "建物地號為必填" }),
  land_lot_no: z.string().min(1, { message: "土地地號為必填" }),
  address: z.string().min(1, { message: "地址為必填" }),
});

/**
 * 表單 tab 結構，給 UI 元件迭代用。
 */
export interface FormFieldDef {
  key: keyof ResidentialPayload | string;
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

/** 5 個 tab 的成屋表單結構 */
export const residentialFormTabs: FormTab[] = [
  {
    id: "identification",
    label: "標示",
    fields: [
      { key: "building_lot_no", label: "建物地號", type: "text", required: true },
      { key: "land_lot_no", label: "土地地號", type: "text", required: true },
      { key: "floor_area", label: "建物面積（坪）", type: "number" },
      { key: "building_age", label: "屋齡（年）", type: "number" },
      { key: "building_structure", label: "建物結構", type: "text" },
      { key: "floor_total", label: "總樓層", type: "number" },
      { key: "floor_this", label: "本戶樓層", type: "number" },
    ],
  },
  {
    id: "rights",
    label: "權利",
    fields: [
      { key: "ownership_type", label: "所有權型態", type: "text" },
      { key: "mortgage_status", label: "抵押權狀態", type: "text" },
      { key: "other_rights", label: "其他權利", type: "textarea" },
    ],
  },
  {
    id: "tax",
    label: "稅費",
    fields: [
      { key: "tax_land_value", label: "土地公告現值（元）", type: "number" },
      { key: "tax_building_value", label: "建物評定現值（元）", type: "number" },
      { key: "tax_property_tax_annual", label: "年度房屋稅（元）", type: "number" },
      { key: "tax_land_value_tax_annual", label: "年度地價稅（元）", type: "number" },
    ],
  },
  {
    id: "condition",
    label: "現況",
    fields: [
      { key: "condition_leakage", label: "漏水滲水", type: "tristate" },
      { key: "condition_renovation", label: "重大裝修", type: "tristate" },
      { key: "condition_illegal_addition", label: "違章增建", type: "tristate" },
      { key: "condition_defects_notes", label: "瑕疵備註", type: "textarea" },
    ],
  },
  {
    id: "attachments",
    label: "附件",
    fields: [
      { key: "attachment_property_deed", label: "附權狀影本", type: "tristate" },
      { key: "attachment_floor_plan", label: "附建物平面圖", type: "tristate" },
      { key: "attachment_photos_notes", label: "照片備註", type: "textarea" },
    ],
  },
];

/** 揭露欄位 — 用於後補 dialog 的缺漏偵測 */
export interface RequiredField {
  key: string;
  label: string;
  fieldType: "text" | "number" | "boolean";
}

/** 從 residentialFormTabs 收集 required: true 的欄位 */
export function getRequiredFields(type: "residential"): RequiredField[] {
  return residentialFormTabs
    .flatMap((tab) => tab.fields)
    .filter((f) => f.required === true)
    .map((f) => ({
      key: f.key as string,
      label: f.label,
      fieldType:
        f.type === "number" ? "number" : f.type === "tristate" ? "boolean" : "text",
    }));
}

/** 預設值（draft 開新案件時用） */
export const residentialDefaults: ResidentialPayload = {
  building_lot_no: "",
  land_lot_no: "",
  building_structure: "",
  ownership_type: "",
  mortgage_status: "",
  other_rights: "",
  condition_leakage: "unknown",
  condition_renovation: "unknown",
  condition_illegal_addition: "unknown",
  condition_defects_notes: "",
  attachment_property_deed: "unknown",
  attachment_floor_plan: "unknown",
  attachment_photos_notes: "",
};
