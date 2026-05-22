import { describe, expect, it } from "vitest";

import {
  createRegistryProvenancePayload,
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
      results: {
        land_registry: {
          success: true,
          source: "api",
          data: { area: 123.45 },
        },
      },
    });

    expect(isRegistryProvenancePayload(payload)).toBe(true);
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
      status: "failed",
      trustedForPdf: false,
      error: "授權不足，請補授權或改由屋主提供謄本",
    });
    expect(payload.totalCost).toBe(0);
    expect(extractRegistryFailureReasons(payload)).toEqual([
      {
        apiId: "building_ownership",
        status: "failed",
        reason: "授權不足，請補授權或改由屋主提供謄本",
      },
    ]);
  });
});
