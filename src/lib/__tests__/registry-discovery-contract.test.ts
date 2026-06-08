import { describe, expect, it } from "vitest";
import {
  classifyDiscoveryInput,
  normalizeDiscoveryResult,
  normalizeR02DiscoveryRun,
  normalizeR02RecordedDiscoveryRun,
  suggestDiscoveryCorrections,
} from "../registry-discovery-contract";

describe("registry discovery contract", () => {
  it("normalizes manual-required discovery into the shared zero-cost contract", () => {
    const result = normalizeDiscoveryResult({
      status: "manual_required",
      source: "local_discovery",
      normalizedAddress: "台南市永康區勝利街58巷4號",
      candidates: [],
      errors: [{ source: "local_discovery", code: "address_discovery_unavailable", message: "需要人工確認" }],
    });

    expect(result).toEqual({
      status: "manual_required",
      source: "local_discovery",
      normalizedAddress: "台南市永康區勝利街58巷4號",
      candidates: [],
      errors: [{ source: "local_discovery", code: "address_discovery_unavailable", message: "需要人工確認" }],
      trustedForPdf: false,
      totalCostCents: 0,
      cacheHit: false,
      sourceRunId: null,
      inputKind: "doorplate",
      intendedObjectType: "building",
      parsedInput: {
        cityName: "台南市",
        districtName: "永康區",
        roadName: "勝利街",
        laneName: "58",
        alleyName: null,
        doorNumber: "4",
        sectionName: null,
        landNumber: null,
      },
      requiresCandidateSelection: false,
      candidateSelection: {
        state: "not_required",
        selectedRegistryKey: null,
      },
      suggestedCorrections: [],
    });
  });

  it("classifies doorplate, land descriptor, and incomplete inputs before discovery", () => {
    expect(classifyDiscoveryInput("台南市永康區勝利街58巷4號")).toMatchObject({
      inputKind: "doorplate",
      intendedObjectType: "building",
      parsedInput: {
        cityName: "台南市",
        districtName: "永康區",
        roadName: "勝利街",
        laneName: "58",
        doorNumber: "4",
      },
    });
    expect(classifyDiscoveryInput("高雄市苓雅區苓雅二路18巷8弄2號")).toMatchObject({
      inputKind: "doorplate",
      intendedObjectType: "building",
      parsedInput: {
        cityName: "高雄市",
        districtName: "苓雅區",
        roadName: "苓雅二路",
        laneName: "18",
        alleyName: "8",
        doorNumber: "2",
      },
    });
    expect(classifyDiscoveryInput("台南市永康區勝利段1043-0002")).toMatchObject({
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      parsedInput: {
        cityName: "台南市",
        districtName: "永康區",
        sectionName: "勝利段",
        landNumber: "1043-0002",
      },
    });
    expect(classifyDiscoveryInput("勝利段")).toMatchObject({
      inputKind: "incomplete",
      intendedObjectType: "land",
      parsedInput: {
        sectionName: "勝利段",
        landNumber: null,
      },
    });
  });

  it("keeps address correction suggestions separate from confirmation", () => {
    expect(suggestDiscoveryCorrections("高雄市苓雅區苓雅路二段18巷8弄2號")).toEqual([
      {
        from: "苓雅路二段",
        to: "苓雅二路",
        reason: "suspected_kaohsiung_road_order_typo",
      },
    ]);
    const result = normalizeDiscoveryResult({
      status: "manual_required",
      source: "local_discovery",
      normalizedAddress: "高雄市苓雅區苓雅路二段18巷8弄2號",
      candidates: [],
      errors: [{ source: "easymap_r02", code: "easymap_r02_no_candidate", message: "查無門牌" }],
    });

    expect(result.status).toBe("manual_required");
    expect(result.candidates).toEqual([]);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidateSelection).toEqual({
      state: "not_required",
      selectedRegistryKey: null,
    });
    expect(result.suggestedCorrections).toEqual([
      {
        from: "苓雅路二段",
        to: "苓雅二路",
        reason: "suspected_kaohsiung_road_order_typo",
      },
    ]);
    expect(result.totalCostCents).toBe(0);
  });

  it("marks discovery candidates as untrusted until formal confirmation", () => {
    const result = normalizeDiscoveryResult({
      status: "candidate_found",
      source: "easymap_r02",
      normalizedAddress: "台南市東區裕農路288巷17號8樓之1",
      candidates: [
        {
          registryKey: "DC-1556-00165000",
          sectionName: "富強段",
          landNumber: "00700000",
          buildingNumber: "00165000",
          source: "easymap_r02",
        },
      ],
      errors: [],
      cacheHit: true,
      sourceRunId: "run-001",
    });

    expect(result.trustedForPdf).toBe(false);
    expect(result.totalCostCents).toBe(0);
    expect(result.cacheHit).toBe(true);
    expect(result.sourceRunId).toBe("run-001");
  });

  it("normalizes multiple R02 candidates into the shared discovery candidate contract", () => {
    const result = normalizeR02DiscoveryRun(
      {
        adapter: "easymap_r02_desktop",
        parser_version: "r02-text-v1",
        input_address: "台南市東區裕農路288巷17號8樓之1",
        status: "candidate_unconfirmed",
        total_cost_cents: 0,
        candidates: [
          {
            administrative_district: "臺南市 東區",
            land_office: "東南地政事務所",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700000",
            building_no: "00204000",
            building_area_sqm: null,
            total_floor_count: null,
            floor_label: null,
            completion_date_roc: null,
            age_years: null,
            main_use: "住家用",
          },
          {
            administrative_district: "臺南市 東區",
            land_office: "東南地政事務所",
            section_code: "1556",
            section_name: "富強段",
            land_no: "00700001",
            building_no: "00204001",
            building_area_sqm: null,
            total_floor_count: null,
            floor_label: null,
            completion_date_roc: null,
            age_years: null,
            main_use: "住家用",
          },
        ],
        raw_summary: "查詢結果",
        missing_fields: [],
        error_code: null,
        next_action: null,
      },
      { sourceRunId: "run-r02-001", cacheHit: true },
    );

    expect(result).toMatchObject({
      status: "candidate_found",
      source: "easymap_r02",
      normalizedAddress: "台南市東區裕農路288巷17號8樓之1",
      trustedForPdf: false,
      totalCostCents: 0,
      cacheHit: true,
      sourceRunId: "run-r02-001",
    });
    expect(result.candidates).toEqual([
      {
        registryKey: "r02:1556:00700000:00204000",
        sectionName: "富強段",
        landNumber: "00700000",
        buildingNumber: "00204000",
        source: "easymap_r02",
        confidence: "needs_selection",
        objectType: "building",
      },
      {
        registryKey: "r02:1556:00700001:00204001",
        sectionName: "富強段",
        landNumber: "00700001",
        buildingNumber: "00204001",
        source: "easymap_r02",
        confidence: "needs_selection",
        objectType: "building",
      },
    ]);
    expect(result.inputKind).toBe("doorplate");
    expect(result.requiresCandidateSelection).toBe(true);
    expect(result.candidateSelection).toEqual({
      state: "required",
      selectedRegistryKey: null,
    });
  });

  it("marks low-confidence candidates as unresolved even when only one candidate remains", () => {
    const result = normalizeDiscoveryResult({
      status: "low_confidence_unresolved",
      source: "local_discovery",
      normalizedAddress: "台南市東區東和路47號3樓",
      candidates: [
        {
          registryKey: "dc:1514:02210032:03045000",
          sectionName: "東光段",
          landNumber: "02210032",
          buildingNumber: "03045000",
          source: "local_discovery",
          confidence: "low",
          objectType: "building",
        },
      ],
    });

    expect(result.status).toBe("low_confidence_unresolved");
    expect(result.requiresCandidateSelection).toBe(true);
    expect(result.candidateSelection).toEqual({
      state: "required",
      selectedRegistryKey: null,
    });
  });

  it("preserves selected target state when the user picks a candidate", () => {
    const result = normalizeDiscoveryResult({
      status: "candidate_found",
      source: "local_discovery",
      normalizedAddress: "台南市東區裕農路288巷17號8樓之1",
      selectedRegistryKey: "r02:1556:00700001:00204001",
      candidates: [
        {
          registryKey: "r02:1556:00700000:00204000",
          sectionName: "富強段",
          landNumber: "00700000",
          buildingNumber: "00204000",
          source: "easymap_r02",
        },
        {
          registryKey: "r02:1556:00700001:00204001",
          sectionName: "富強段",
          landNumber: "00700001",
          buildingNumber: "00204001",
          source: "easymap_r02",
        },
      ],
    });

    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidateSelection).toEqual({
      state: "selected",
      selectedRegistryKey: "r02:1556:00700001:00204001",
    });
  });

  it("normalizes failed R02 recordings into manual-required errors with sourceRunId evidence", () => {
    const result = normalizeR02RecordedDiscoveryRun({
      run_id: "run-r02-failed",
      ok: false,
      discovery: null,
      error: {
        adapter: "easymap_r02_desktop",
        parser_version: "r02-text-v1",
        status: "r02_parse_failed",
        error_code: "r02_required_fields_missing",
        missing_fields: ["section_code", "building_no"],
        raw_summary: "查無資料",
        next_action: "manual_registry_key_required",
      },
    }, "台南市永康區勝利街58巷4號");

    expect(result).toMatchObject({
      status: "manual_required",
      source: "easymap_r02",
      normalizedAddress: "台南市永康區勝利街58巷4號",
      candidates: [],
      trustedForPdf: false,
      totalCostCents: 0,
      cacheHit: false,
      sourceRunId: "run-r02-failed",
    });
    expect(result.errors).toEqual([
      {
        source: "easymap_r02",
        code: "r02_required_fields_missing",
        message: "缺少地段代碼、建號，請人工確認地段、地號或建號。",
      },
    ]);
  });
});
