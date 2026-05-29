import { describe, expect, it } from "vitest";

import {
  createRegistryProvenancePayload,
  extractCandidateOptions,
  extractPreSurveyRegistryData,
  extractRegistryFailureReasons,
  extractTrustedRegistryData,
  isRegistryProvenancePayload,
  normalizeRegistryPayloadForPreview,
} from "../registry-provenance";

describe("registry-provenance", () => {
  it("wraps successful MOI API data as trusted for PDF", () => {
    const payload = createRegistryProvenancePayload({
      parcelId: "DC-1556-00700000",
      generatedAt: "2026-05-22T00:00:00.000Z",
      isPaid: true,
      pricingNote: "付費正式查詢",
      results: {
        land_registry: {
          success: true,
          source: "api",
          data: { area: 123.45 },
        },
      },
    });

    expect(isRegistryProvenancePayload(payload)).toBe(true);
    expect(payload.isPaid).toBe(true);
    expect(payload.pricingNote).toBe("付費正式查詢");
    expect(payload.entries.land_registry).toMatchObject({
      source: "moi_api",
      status: "success",
      trustedForPdf: true,
    });
    expect(extractTrustedRegistryData(payload)).toEqual({
      land_registry: { area: 123.45 },
    });
  });

  it("keeps mock and failed API data out of PDF trusted data", () => {
    const payload = createRegistryProvenancePayload({
      results: {
        building_registry: {
          success: true,
          source: "mock",
          data: { area: 99 },
        },
        building_ownership: {
          success: false,
          source: "api",
          error: "COP317",
        },
      },
    });

    expect(payload.entries.building_registry).toBeUndefined();
    expect(payload.entries.building_ownership).toMatchObject({
      status: "failed",
      trustedForPdf: false,
    });
    expect(extractTrustedRegistryData(payload)).toEqual({});
  });

  it("allows user-confirmed manual entries but blocks candidate/probe payloads", () => {
    const payload = {
      schema: "aire.registry-provenance.v1",
      generatedAt: "2026-05-22T00:00:00.000Z",
      entries: {
        manual_owner_check: {
          apiId: "manual_owner_check",
          source: "manual",
          status: "manual_confirmed",
          trustedForPdf: true,
          data: { owner_name: "田耀中" },
        },
        raw_probe: {
          apiId: "raw_probe",
          source: "raw_probe",
          status: "probe",
          trustedForPdf: false,
          data: { fake: true },
        },
        candidate_building: {
          apiId: "candidate_building",
          source: "public_candidate",
          status: "candidate",
          trustedForPdf: false,
          data: { building_no: "00165000" },
        },
      },
    };

    expect(extractTrustedRegistryData(payload)).toEqual({
      manual_owner_check: { owner_name: "田耀中" },
    });
  });

  it("normalizes provenance payloads for preview while leaving legacy preview payloads readable", () => {
    const envelope = createRegistryProvenancePayload({
      results: {
        land_registry: { success: true, data: { area: 1 } },
      },
    });

    expect(normalizeRegistryPayloadForPreview(envelope)).toEqual({
      land_registry: { area: 1 },
    });
    expect(normalizeRegistryPayloadForPreview({ land_registry: { area: 2 } })).toEqual({
      land_registry: { area: 2 },
    });
  });

  it("keeps public candidate data usable for pre-survey preview but not trusted PDF fields", () => {
    const payload = createRegistryProvenancePayload({
      parcelId: "DC-1556-00700000",
      generatedAt: "2026-05-22T00:00:00.000Z",
      isPaid: false,
      pricingNote: "免費前查",
      results: {
        building_registry: {
          success: true,
          source: "public_candidate",
          data: {
            building_number: "00165000",
            building_address: "台南市東區裕農路288巷17號8樓之1",
          },
        },
        raw_probe: {
          success: true,
          source: "raw_probe",
          data: { owner_name: "不可放入物調表" },
        },
      },
    });

    expect(payload.entries.building_registry).toMatchObject({
      source: "public_candidate",
      status: "candidate",
      trustedForPdf: false,
    });
    expect(payload.isPaid).toBe(false);
    expect(payload.pricingNote).toBe("免費前查");
    expect(payload.entries.raw_probe).toMatchObject({
      source: "raw_probe",
      status: "probe",
      trustedForPdf: false,
    });
    expect(extractTrustedRegistryData(payload)).toEqual({});
    expect(extractPreSurveyRegistryData(payload)).toEqual({
      building_registry: {
        building_number: "00165000",
        building_address: "台南市東區裕農路288巷17號8樓之1",
      },
    });
    expect(normalizeRegistryPayloadForPreview(payload)).toEqual({
      building_registry: {
        building_number: "00165000",
        building_address: "台南市東區裕農路288巷17號8樓之1",
      },
    });
  });

  it("preserves failed lookup reasons for pre-survey status without blocking the case", () => {
    const payload = createRegistryProvenancePayload({
      totalCost: 0,
      results: {
        building_ownership: {
          success: false,
          source: "api",
          error: "授權不足，請補授權或改由屋主提供謄本",
        },
      },
    });

    expect(payload.entries.building_ownership).toMatchObject({
      source: "moi_api",
      status: "unauthorized",
      trustedForPdf: false,
      error: "缺少屋主授權或授權不足",
    });
    expect(payload.totalCost).toBe(0);
    expect(extractRegistryFailureReasons(payload)).toEqual([
      {
        apiId: "building_ownership",
        status: "unauthorized",
        reason: "缺少屋主授權或授權不足",
      },
    ]);
  });

  it("preserves Yunong land and building candidate parcel options for pre-survey", () => {
    const payload = createRegistryProvenancePayload({
      parcelId: "DC-1556-00700000",
      candidateOptions: [
        {
          candidate_id: "land:DC-1556-00700000",
          parcel_type: "land",
          section_code: "1556",
          section_name: "富強段",
          parcel_number: "00700000",
          normalized_parcel_id: "DC-1556-00700000",
          source: "public_reference",
          confidence_label: "same_address_candidate",
          official_status: "candidate_unconfirmed",
          query_status: "candidate_data_available" as const,
          summary_fields: { landAreaSqm: 120.5 },
          warnings: ["待屋主或權狀確認"],
        },
        ...["00165000", "00167000", "00229000", "00230000"].map((parcelNumber) => ({
          candidate_id: `building:DC-1556-${parcelNumber}`,
          parcel_type: "building" as const,
          section_code: "1556",
          section_name: "富強段",
          parcel_number: parcelNumber,
          normalized_parcel_id: `DC-1556-${parcelNumber}`,
          source: "public_reference",
          confidence_label: "same_address_candidate",
          official_status: "candidate_unconfirmed",
          query_status: "candidate_data_available" as const,
          summary_fields: {
            registeredAreaPing: 31.25,
            mainBuildingAreaPing: 23.1,
            legalUse: "住家用",
            constructionDate: "083/10/18",
            floor: "8樓之1",
          },
          warnings: ["待屋主或權狀確認是否為 8樓之1"],
        })),
      ],
      selectedCandidateIds: {
        land: "land:DC-1556-00700000",
        building: "building:DC-1556-00165000",
      },
      coordinateSource: {
        lat: 22.986314,
        lng: 120.22908,
        source: "candidate_reference",
      },
    });

    expect(extractCandidateOptions(payload).map((candidate) => candidate.normalized_parcel_id)).toEqual([
      "DC-1556-00700000",
      "DC-1556-00165000",
      "DC-1556-00167000",
      "DC-1556-00229000",
      "DC-1556-00230000",
    ]);
    expect(payload.selected_candidate_ids?.building).toBe("building:DC-1556-00165000");
    expect(payload.coordinate_source).toMatchObject({
      lat: 22.986314,
      lng: 120.22908,
      source: "candidate_reference",
    });
  });

  it("keeps successful and failed candidate summaries comparable before confirmation", () => {
    const payload = createRegistryProvenancePayload({
      candidateOptions: [
        {
          candidate_id: "building:DC-1556-00165000",
          parcel_type: "building",
          section_code: "1556",
          section_name: "富強段",
          parcel_number: "00165000",
          normalized_parcel_id: "DC-1556-00165000",
          source: "public_reference",
          confidence_label: "same_address_candidate",
          official_status: "candidate_unconfirmed",
          query_status: "candidate_data_available",
          summary_fields: {
            registeredAreaPing: 31.25,
            mainBuildingAreaPing: 23.1,
            legalUse: "住家用",
            constructionDate: "083/10/18",
            floor: "8樓之1",
          },
          query_cost: 12,
          warnings: [],
        },
        {
          candidate_id: "building:DC-1556-00167000",
          parcel_type: "building",
          section_code: "1556",
          section_name: "富強段",
          parcel_number: "00167000",
          normalized_parcel_id: "DC-1556-00167000",
          source: "public_reference",
          confidence_label: "same_address_candidate",
          official_status: "candidate_unconfirmed",
          query_status: "failed",
          error_code: "COP312",
          error_message: "取得服務資訊失敗",
          summary_fields: {},
          query_cost: 0,
          warnings: ["候選 probe 失敗，仍保留供比對"],
        },
      ],
    });

    expect(extractCandidateOptions(payload)).toMatchObject([
      {
        normalized_parcel_id: "DC-1556-00165000",
        query_status: "candidate_data_available",
        summary_fields: {
          registeredAreaPing: 31.25,
          mainBuildingAreaPing: 23.1,
          legalUse: "住家用",
          constructionDate: "083/10/18",
          floor: "8樓之1",
        },
      },
      {
        normalized_parcel_id: "DC-1556-00167000",
        query_status: "failed",
        error_code: "COP312",
      },
    ]);
  });

  it("classifies common formal pull failures into actionable customer-facing states", () => {
    const payload = createRegistryProvenancePayload({
      totalCost: 0,
      results: {
        api_key: {
          success: false,
          source: "api",
          error: "ApiKeyNotConfigured",
        },
        ownership: {
          success: false,
          source: "api",
          error: "ConsentRequired",
        },
        balance: {
          success: false,
          source: "api",
          error: "InsufficientBalance",
        },
        permission: {
          success: false,
          source: "api",
          error: "NlscPermissionDenied",
        },
        not_found: {
          success: false,
          source: "api",
          error: "NoDataFound",
        },
      },
    });

    expect(payload.entries.api_key).toMatchObject({
      status: "failed",
      error: "未設定地政 API 金鑰",
      sourceNote: "請到設定頁設定地政 API 金鑰後重試",
    });
    expect(payload.entries.ownership).toMatchObject({
      status: "unauthorized",
      error: "缺少屋主授權或授權不足",
      sourceNote: "請補屋主授權或改由屋主提供正式文件",
    });
    expect(payload.entries.balance).toMatchObject({
      status: "failed",
      error: "地政 API 餘額不足",
      sourceNote: "請補值或改由人工補件後再產出客戶版 PDF",
    });
    expect(payload.entries.permission).toMatchObject({
      status: "unauthorized",
      error: "API 權限不足",
      sourceNote: "請確認服務權限已開通，或改走人工補件",
    });
    expect(payload.entries.not_found).toMatchObject({
      status: "failed",
      error: "查無正式地政資料",
      sourceNote: "請確認地號/建號後重試，或由屋主提供謄本補件",
    });
  });
});
