import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:1420" });

const LOCAL_DEV_TOKEN = "aire-dev-local-token";
const ARTIFACT_DIR = "artifacts/smoke";
const OUTPUT_PATH = join(ARTIFACT_DIR, "real-property-fixtures-free-discovery.json");

const fixtures = [
  {
    id: "highrise-yunong",
    propertyType: "大樓",
    inputKind: "doorplate",
    address: "台南市東區裕農路288巷17號8樓之1",
  },
  {
    id: "villa-shengli",
    propertyType: "別墅",
    inputKind: "doorplate",
    address: "台南市永康區勝利街 2 巷 92 弄 13 號",
  },
  {
    id: "huaxia-dongzhi",
    propertyType: "華廈",
    inputKind: "doorplate",
    address: "臺南市東區東智街 88 號 5 樓",
  },
  {
    id: "townhouse-yongkang-shengli-58",
    propertyType: "透天",
    inputKind: "doorplate",
    address: "台南市永康區勝利街58巷4號",
  },
  {
    id: "farmland-nanhua",
    propertyType: "農地",
    inputKind: "land_descriptor",
    address: "台南市南化區南化段 850-1 地號",
  },
  {
    id: "building-land-gangziqian-1090",
    propertyType: "建地",
    inputKind: "land_descriptor",
    address: "台南市新市區港子前段 1090 地號",
  },
  {
    id: "building-land-gangziqian-1090-26",
    propertyType: "建地",
    inputKind: "land_descriptor",
    address: "台南市新市區港子前段 1090-26 地號",
  },
  {
    id: "apartment-zhonghua-east",
    propertyType: "公寓",
    inputKind: "doorplate",
    address: "台南市東區中華東路三段24巷8號5樓",
  },
  {
    id: "apartment-zhonghua-east-arabic-section",
    propertyType: "公寓",
    inputKind: "doorplate",
    address: "台南市東區中華東路3段24巷8號5樓",
  },
] as const;

test("real property fixtures run through free address discovery without COP cost", async ({ request }) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const matrix = [];
  for (const fixture of fixtures) {
    const response = await request.post("/api/local/address-discovery", {
      data: { address: fixture.address, allowMockFallback: false },
      headers: { "X-Local-Token": LOCAL_DEV_TOKEN },
      timeout: 30_000,
    });

    expect(response.ok(), `${fixture.id} HTTP status`).toBe(true);
    const body = await response.json();
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const totalCostCents = body.totalCostCents ?? body.total_cost_cents ?? 0;

    matrix.push({
      ...fixture,
      status: body.status,
      normalizedAddress: body.normalizedAddress ?? body.normalized_address ?? null,
      discoveredInputKind: body.inputKind ?? body.input_kind ?? null,
      intendedObjectType: body.intendedObjectType ?? body.intended_object_type ?? null,
      requiresCandidateSelection: Boolean(body.requiresCandidateSelection ?? body.requires_candidate_selection),
      candidateCount: candidates.length,
      totalCostCents,
      firstCandidate: candidates[0] ?? null,
      errors: body.errors ?? [],
    });

    expect(totalCostCents, `${fixture.id} must stay free`).toBe(0);
    expect(["candidate_found", "manual_required", "error"], `${fixture.id} known discovery status`).toContain(body.status);
  }

  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        boundary: "free address discovery only; no COP formal pull",
        matrix,
      },
      null,
      2,
    ),
  );

  expect(matrix).toHaveLength(fixtures.length);
  const apartmentChinese = matrix.find((row) => row.id === "apartment-zhonghua-east");
  const apartmentArabic = matrix.find((row) => row.id === "apartment-zhonghua-east-arabic-section");
  expect(
    [apartmentChinese?.status, apartmentArabic?.status],
    "At least one equivalent road section fixture should discover a free candidate; live R02/Z10 may only answer one numeral format",
  ).toContain("candidate_found");
  if (apartmentChinese?.firstCandidate && apartmentArabic?.firstCandidate) {
    expect(apartmentArabic.firstCandidate.section_code).toBe(apartmentChinese.firstCandidate.section_code);
    expect(apartmentArabic.firstCandidate.lot_number).toBe(apartmentChinese.firstCandidate.lot_number);
    expect(apartmentArabic.firstCandidate.building_number).toBe(apartmentChinese.firstCandidate.building_number);
  }
});
