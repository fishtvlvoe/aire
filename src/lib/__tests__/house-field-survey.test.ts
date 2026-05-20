import { describe, expect, it } from "vitest";

import {
  HOUSE_FIELD_SURVEY_COMMON_FIELDS,
  HOUSE_FIELD_SURVEY_TEMPLATES,
  createHouseFieldSurveyDraft,
  getHouseFieldSurveyTemplate,
  type HousePropertySurveyType,
} from "@/lib/page-contracts/house-field-survey";

const expectedTypes: HousePropertySurveyType[] = [
  "大樓華廈",
  "公寓",
  "透天別墅",
  "店面",
  "套房",
  "農舍",
  "廠房",
];

describe("house-field-survey templates", () => {
  it("provides the seven first-wave house property type templates", () => {
    expect(Object.keys(HOUSE_FIELD_SURVEY_TEMPLATES)).toEqual(expectedTypes);
    for (const propertyType of expectedTypes) {
      const template = getHouseFieldSurveyTemplate(propertyType);
      expect(template.propertyType).toBe(propertyType);
      expect(template.commonFields).toHaveLength(HOUSE_FIELD_SURVEY_COMMON_FIELDS.length);
      expect(template.typeFields.length).toBeGreaterThan(0);
      expect(template.photoFields.map((field) => field.label)).toContain("正門外觀圖");
      expect(template.strengthWeaknessFields.map((field) => field.label)).toEqual([
        "優點1",
        "優點2",
        "優點3",
        "缺點1",
        "缺點2",
        "缺點3",
      ]);
    }
  });

  it("keeps type-specific fields separated so the workbench does not mix property types", () => {
    expect(getHouseFieldSurveyTemplate("大樓華廈").typeFields.map((field) => field.label)).toContain(
      "公設比",
    );
    expect(getHouseFieldSurveyTemplate("公寓").typeFields.map((field) => field.label)).toContain(
      "樓梯間使用狀況",
    );
    expect(getHouseFieldSurveyTemplate("透天別墅").typeFields.map((field) => field.label)).toContain(
      "車庫寬度",
    );
    expect(getHouseFieldSurveyTemplate("店面").typeFields.map((field) => field.label)).toContain(
      "店面寬",
    );
    expect(getHouseFieldSurveyTemplate("套房").typeFields.map((field) => field.label)).toContain(
      "是否獨立門牌",
    );
    expect(getHouseFieldSurveyTemplate("農舍").typeFields.map((field) => field.label)).toContain(
      "是否合法農舍",
    );
    expect(getHouseFieldSurveyTemplate("廠房").typeFields.map((field) => field.label)).toContain(
      "三相電",
    );
  });

  it("creates a blank field-survey draft without placeholder text", () => {
    expect(createHouseFieldSurveyDraft()).toEqual({ propertyType: "大樓華廈", values: {} });
    expect(JSON.stringify(createHouseFieldSurveyDraft("店面"))).not.toContain("待補");
  });
});
