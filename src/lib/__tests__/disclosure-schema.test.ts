/**
 * 單元測試 — disclosure schema 工具函式
 *
 * 測試對象：
 *   - getRequiredFields("residential") from disclosure-schema-residential
 *   - getRequiredFields("land") from disclosure-schema-land
 *
 * 驗收：每個 RequiredField 必須有 key、label、fieldType（"text"|"number"|"boolean"）
 */

import { describe, it, expect } from "vitest";

import { getRequiredFields as getResidentialRequiredFields } from "@/lib/disclosure-schema-residential";
import { getRequiredFields as getLandRequiredFields } from "@/lib/disclosure-schema-land";

const VALID_FIELD_TYPES = ["text", "number", "boolean"] as const;

describe("getRequiredFields", () => {
  describe("residential", () => {
    it("should return non-empty array", () => {
      const fields = getResidentialRequiredFields("residential");
      expect(fields.length).toBeGreaterThan(0);
    });

    it("each field should have key, label, fieldType", () => {
      const fields = getResidentialRequiredFields("residential");
      for (const f of fields) {
        expect(f).toHaveProperty("key");
        expect(f).toHaveProperty("label");
        expect(f).toHaveProperty("fieldType");
        expect(VALID_FIELD_TYPES).toContain(f.fieldType);
      }
    });

    it("key and label should be non-empty strings", () => {
      const fields = getResidentialRequiredFields("residential");
      for (const f of fields) {
        expect(typeof f.key).toBe("string");
        expect(f.key.length).toBeGreaterThan(0);
        expect(typeof f.label).toBe("string");
        expect(f.label.length).toBeGreaterThan(0);
      }
    });

    it("should include building_lot_no as required text field", () => {
      const fields = getResidentialRequiredFields("residential");
      const match = fields.find((f) => f.key === "building_lot_no");
      expect(match).toBeDefined();
      expect(match?.fieldType).toBe("text");
    });

    it("should include land_lot_no as required text field", () => {
      const fields = getResidentialRequiredFields("residential");
      const match = fields.find((f) => f.key === "land_lot_no");
      expect(match).toBeDefined();
      expect(match?.fieldType).toBe("text");
    });
  });

  describe("land", () => {
    it("should return non-empty array", () => {
      const fields = getLandRequiredFields("land");
      expect(fields.length).toBeGreaterThan(0);
    });

    it("each field should have key, label, fieldType", () => {
      const fields = getLandRequiredFields("land");
      for (const f of fields) {
        expect(f).toHaveProperty("key");
        expect(f).toHaveProperty("label");
        expect(f).toHaveProperty("fieldType");
        expect(VALID_FIELD_TYPES).toContain(f.fieldType);
      }
    });

    it("key and label should be non-empty strings", () => {
      const fields = getLandRequiredFields("land");
      for (const f of fields) {
        expect(typeof f.key).toBe("string");
        expect(f.key.length).toBeGreaterThan(0);
        expect(typeof f.label).toBe("string");
        expect(f.label.length).toBeGreaterThan(0);
      }
    });

    it("should include land_lot_no as required text field", () => {
      const fields = getLandRequiredFields("land");
      const match = fields.find((f) => f.key === "land_lot_no");
      expect(match).toBeDefined();
      expect(match?.fieldType).toBe("text");
    });
  });
});
