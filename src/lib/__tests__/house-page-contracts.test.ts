import { describe, expect, it } from "vitest";

import {
  DEFAULT_GIFTED_EQUIPMENT_NOTE,
  DEFAULT_PAYMENT_METHOD_NOTE,
  HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE,
  HOUSE_LIVING_FUNCTION_TEMPLATE,
  HOUSE_OWNERSHIP_NOTES_TEMPLATE,
  HOUSE_TAX_NOTES_TEMPLATE,
  createBlankTaxAmount,
  createCalculatedTaxAmount,
  createHouseConditionSurveyDraft,
  createHouseLivingFunctionDraft,
  createManualTaxAmount,
  getPrintableText,
  hasForbiddenPrintablePlaceholder,
  HOUSE_TRANSACTION_TYPE_OPTIONS,
  HOUSE_2026_LEGAL_UPDATE_FIELDS,
} from "@/lib/page-contracts/house-mvp";

describe("house MVP page-contract templates", () => {
  it("uses the photo-based 38-question condition survey as the MVP template", () => {
    expect(HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.questions).toHaveLength(38);
    expect(HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.formVersion).toContain("38q");
    expect(HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.questions.map((q) => q.questionNo)).toEqual(
      Array.from({ length: 38 }, (_, index) => index + 1),
    );
  });

  it("creates blank survey answers as empty checkbox rows with writable space", () => {
    const draft = createHouseConditionSurveyDraft();

    expect(draft.questions).toHaveLength(38);
    expect(draft.questions.every((q) => q.answer === "blank")).toBe(true);
    expect(draft.questions.every((q) => q.note === "")).toBe(true);
    expect(draft.answerRenderMode).toBe("empty_checkboxes_with_writable_space");
  });

  it("keeps living-function map automation first while allowing manual fallback", () => {
    expect(HOUSE_LIVING_FUNCTION_TEMPLATE.map.requiredGeneration).toBe(true);
    expect(HOUSE_LIVING_FUNCTION_TEMPLATE.map.failurePolicy).toBe("warn_allow_manual_override");

    const draft = createHouseLivingFunctionDraft();
    expect(draft.mapSource).toBe("auto_generated");
    expect(draft.mapAssetId).toBe("");
    expect(draft.facilities).toEqual([]);
  });

  it("models tax amounts as blank, manual, or calculated with required calculation metadata", () => {
    expect(createBlankTaxAmount()).toEqual({ source: "blank", displayValue: "" });
    expect(createManualTaxAmount("12000")).toEqual({ source: "manual", displayValue: "12000" });

    expect(
      createCalculatedTaxAmount("12000", {
        formulaVersion: "lvti-2026-05-20",
        sourceSnapshotAt: "2026-05-20T10:00:00+08:00",
        warnings: ["概算"],
      }),
    ).toEqual({
      source: "calculated",
      displayValue: "12000",
      formulaVersion: "lvti-2026-05-20",
      sourceSnapshotAt: "2026-05-20T10:00:00+08:00",
      warnings: ["概算"],
    });
  });

  it("keeps legal and tax wording in fixed templates", () => {
    expect(HOUSE_OWNERSHIP_NOTES_TEMPLATE.editability).toBe("admin_template_only");
    expect(HOUSE_OWNERSHIP_NOTES_TEMPLATE.printPolicy).toBe("print_default_clauses");
    expect(HOUSE_OWNERSHIP_NOTES_TEMPLATE.clauses).toHaveLength(11);

    expect(HOUSE_TAX_NOTES_TEMPLATE.editability).toBe("admin_template_only");
    expect(HOUSE_TAX_NOTES_TEMPLATE.printPolicy).toBe("print_even_when_values_blank");
    expect(HOUSE_TAX_NOTES_TEMPLATE.notes).toHaveLength(7);
    expect(HOUSE_TAX_NOTES_TEMPLATE.estimateCaveat).toContain("概算");
    expect(HOUSE_TAX_NOTES_TEMPLATE.estimateCaveat).toContain("稅捐機關核發稅單");
  });

  it("provides fixed property-rights defaults without hard-coding transaction type", () => {
    expect(HOUSE_TRANSACTION_TYPE_OPTIONS[0]).toEqual({ value: "", label: "" });
    expect(HOUSE_TRANSACTION_TYPE_OPTIONS.map((option) => option.value)).toContain("租賃");
    expect(HOUSE_TRANSACTION_TYPE_OPTIONS.map((option) => option.value)).toContain("交換");
    expect(DEFAULT_GIFTED_EQUIPMENT_NOTE).toBe("依標的物現況說明書賣方表達內容為準");
    expect(DEFAULT_PAYMENT_METHOD_NOTE).toBe("依買賣契約為準");
  });

  it("adds 2026 legal-update fields as blank-by-default disclosure fields", () => {
    expect(HOUSE_2026_LEGAL_UPDATE_FIELDS.map((field) => field.label)).toEqual([
      "太陽光電設備狀態",
      "太陽光電設備位置",
      "建築能效狀況",
      "建築能效備註",
    ]);
    expect(HOUSE_2026_LEGAL_UPDATE_FIELDS.every((field) => field.defaultValue === "")).toBe(true);
    expect(HOUSE_2026_LEGAL_UPDATE_FIELDS.every((field) => field.printPolicy === "blank_until_known")).toBe(true);
    expect(hasForbiddenPrintablePlaceholder(HOUSE_2026_LEGAL_UPDATE_FIELDS)).toBe(false);
  });

  it("renders blank fields as empty strings instead of 待補", () => {
    expect(getPrintableText(null)).toBe("");
    expect(getPrintableText(undefined)).toBe("");
    expect(getPrintableText("")).toBe("");
    expect(hasForbiddenPrintablePlaceholder(HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE)).toBe(false);
    expect(hasForbiddenPrintablePlaceholder(HOUSE_OWNERSHIP_NOTES_TEMPLATE)).toBe(false);
    expect(hasForbiddenPrintablePlaceholder(HOUSE_TAX_NOTES_TEMPLATE)).toBe(false);
  });
});
