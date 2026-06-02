import type { Page } from "@playwright/test";

const FORMAL_PULL_FIXTURE: Record<string, { success: true; source: "api"; data: Record<string, unknown> }> = {
  land_registry: {
    success: true,
    source: "api",
    data: {
      section: "兵南段",
      section_name: "兵南段",
      lot_number: "04140000",
      land_no: "04140000",
      area: 66.29,
      purpose: "建",
    },
  },
  land_value: {
    success: true,
    source: "api",
    data: {
      announced_value: 156000,
      assessed_value: 92000,
    },
  },
  building_registry: {
    success: true,
    source: "api",
    data: {
      building_number: "00084000",
      building_no: "00084000",
      area: 128.2,
      building_area: 128.2,
      main_building_area: 102.4,
      auxiliary_area: 12.8,
      common_area: 13,
      building_purpose: "住商用",
      purpose: "住商用",
      material: "鋼筋混凝土造",
      building_floor: "一層，二層，三層，騎樓，電梯樓梯間",
      total_floor_count: "003",
      construction_date: "0710804",
      construction_company: "E2E 測試建商",
    },
  },
  building_ownership: {
    success: true,
    source: "api",
    data: {
      owner_name: "余啟彰",
      certificate_no: "測試權狀字第000001號",
      ownership_date: "0831213",
      registration_reason: "買賣",
      numerator: 1,
      denominator: 1,
    },
  },
  building_other_rights: {
    success: true,
    source: "api",
    data: {
      other_rights_detail: "無",
    },
  },
};

const FORMAL_PULL_COST_BY_API_ID: Record<string, number> = {
  land_registry: 1,
  land_value: 0,
  building_registry: 1,
  building_ownership: 1,
  building_other_rights: 1,
};

export async function mockFormalPullData(page: Page) {
  let callCount = 0;

  await page.route("**/api/local/formal-pull-data", async (route) => {
    const payload = route.request().postDataJSON() as { apiIds?: unknown } | null;
    const requestedApiIds = Array.isArray(payload?.apiIds)
      ? payload.apiIds.filter((apiId): apiId is string => typeof apiId === "string")
      : Object.keys(FORMAL_PULL_FIXTURE);
    const cacheHit = callCount > 0;
    callCount += 1;

    const results = Object.fromEntries(
      requestedApiIds.map((apiId) => {
        const fixture = FORMAL_PULL_FIXTURE[apiId] ?? {
          success: true,
          source: "api" as const,
          data: { source_api: apiId },
        };
        return [
          apiId,
          {
            ...fixture,
            source: cacheHit ? "cache" : fixture.source,
          },
        ];
      }),
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        run_id: cacheHit ? "e2e-formal-run-cache" : "e2e-formal-run-001",
        results,
        total_cost: cacheHit
          ? 0
          : requestedApiIds.reduce((sum, apiId) => sum + (FORMAL_PULL_COST_BY_API_ID[apiId] ?? 0), 0),
        cache_hit: cacheHit,
        source_run_id: cacheHit ? "e2e-formal-run-001" : null,
      }),
    });
  });
}
