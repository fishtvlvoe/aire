import { describe, it, expect, vi, afterEach } from "vitest";
import type { CodexResult } from "../../../codex-client";

// 攔截 runCodex，捕獲實際傳入的 prompt 字串以便驗證
let capturedPrompt = "";

vi.mock("../../../codex-client", () => ({
  runCodex: vi.fn().mockImplementation((prompt: string) => {
    capturedPrompt = prompt;
    return Promise.resolve({
      success: true,
      output: "# 測試文件\n這是 mock 輸出",
      status: "ready",
    } satisfies CodexResult);
  }),
  checkCodexStatus: vi.fn().mockResolvedValue("ready"),
}));

import { generateBuildingDossier } from "../dossier-building";
import type { DocumentGeneratorInput } from "../../types";

const BASE_INPUT: DocumentGeneratorInput & {
  extracted_data?: Record<string, unknown>;
  system_computed?: Record<string, unknown>;
  pre_commission_data?: Record<string, unknown>;
  external_data?: Record<string, unknown>;
} = {
  property_type: "apartment",
  field_visit_data: {
    address: "台南市中西區民族路一段 123 號 5 樓",
    total_price: 1200,
  },
  supplementary_data: {},
  extracted_data: {
    building_number: "壹壹零",
    current_purpose: "住家用",
    structure: "鋼筋混凝土造",
    floor_count: 12,
    building_area: 107.5,
    year_built: "民國 90 年 5 月",
    address: "台南市中西區民族路一段 123 號 5 樓",
    land_number: "東安段 1234-5",
    land_area: 350.2,
    rights_range: "1/20",
    announced_land_value: 120000,
  },
  system_computed: {
    report_date: "2026-05-03",
  },
  pre_commission_data: {
    listing_id: "TEST-001",
  },
  external_data: {},
};

describe("dossier-building prompt OCR 欄位對應（Chapter 5 & 6）", () => {
  afterEach(() => {
    capturedPrompt = "";
    vi.clearAllMocks();
  });

  describe("Chapter 5：產權調查表（建物標示）", () => {
    it("prompt 包含 extracted_data.building_area 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.building_area");
    });

    it("prompt 包含 extracted_data.floor_count 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.floor_count");
    });

    it("prompt 包含 extracted_data.year_built 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.year_built");
    });

    it("prompt 包含 extracted_data.building_number 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.building_number");
    });

    it("prompt 包含 extracted_data.current_purpose 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.current_purpose");
    });

    it("prompt 包含坪數換算說明（0.3025）", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("0.3025");
    });

    it("prompt 包含三層優先順序結構（supplementary_data → extracted_data → 待補），無 OCR 標注", async () => {
      await generateBuildingDossier(BASE_INPUT);
      // 驗證三層結構的關鍵標記
      expect(capturedPrompt).toContain("supplementary_data.building_number");
      expect(capturedPrompt).toContain("直接填入值"); // 取代舊的「OCR讀取，請確認」
      expect(capturedPrompt).toContain("{{待補}}");
      expect(capturedPrompt).not.toContain("OCR讀取，請確認");
    });
  });

  describe("Chapter 6：產權調查表（土地標示）", () => {
    it("prompt 包含 extracted_data.land_area 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.land_area");
    });

    it("prompt 包含 extracted_data.rights_range 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.rights_range");
    });

    it("prompt 包含 extracted_data.announced_land_price 欄位指引（修正後正確 key）", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.announced_land_price");
    });

    it("prompt 包含 extracted_data.land_number 欄位指引", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("extracted_data.land_number");
    });

    it("prompt 包含土地面積單位說明（㎡）", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("單位為㎡");
    });

    it("prompt 包含三層優先順序結構（supplementary_data → extracted_data → 待補）", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt).toContain("supplementary_data.land_number");
      expect(capturedPrompt).toContain("supplementary_data.rights_range");
    });
  });

  describe("整體 prompt 結構完整性", () => {
    it("generateBuildingDossier 在 runCodex mock 下正常回傳字串", async () => {
      const result = await generateBuildingDossier(BASE_INPUT);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("runCodex 被呼叫一次，且傳入非空 prompt", async () => {
      await generateBuildingDossier(BASE_INPUT);
      expect(capturedPrompt.length).toBeGreaterThan(100);
    });
  });
});
