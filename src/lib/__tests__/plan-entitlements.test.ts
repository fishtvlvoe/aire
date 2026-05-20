import { describe, expect, it } from "vitest";

import {
  getAutomationControlState,
  getPlanEntitlements,
  type EntitlementFeature,
} from "@/lib/plan-entitlements";

describe("plan-entitlements", () => {
  it("keeps Basic manual workflow enabled while gating automated API features", () => {
    const entitlement = getPlanEntitlements("basic");

    expect(entitlement.features.registry_pull).toBe(true);
    expect(entitlement.features.manual_completion).toBe(true);
    expect(entitlement.features.manual_image_upload).toBe(true);
    expect(entitlement.features.draft_pdf_export).toBe(true);

    const gatedFeatures: EntitlementFeature[] = [
      "real_price",
      "nearby_market",
      "location_map",
      "cadastral_map",
      "aerial_photo",
      "street_view_reference",
      "floor_plan_processing",
      "marketing_modules",
    ];

    for (const feature of gatedFeatures) {
      expect(getAutomationControlState(entitlement, feature)).toMatchObject({
        feature,
        visible: true,
        enabled: false,
      });
    }

    expect(getAutomationControlState(entitlement, "real_price").upgradeRequired).toBe("pro");
    expect(getAutomationControlState(entitlement, "aerial_photo").upgradeRequired).toBe("advanced");
  });

  it("unlocks Pro automation without enabling Advanced-only modules", () => {
    const entitlement = getPlanEntitlements("pro");

    expect(entitlement.features.real_price).toBe(true);
    expect(entitlement.features.nearby_market).toBe(true);
    expect(entitlement.features.location_map).toBe(true);
    expect(entitlement.features.cadastral_map).toBe(true);
    expect(entitlement.features.aerial_photo).toBe(false);
    expect(entitlement.features.street_view_reference).toBe(false);
    expect(entitlement.features.floor_plan_processing).toBe(false);
    expect(entitlement.features.marketing_modules).toBe(false);
  });

  it("unlocks Advanced automation and future marketing modules", () => {
    const entitlement = getPlanEntitlements("advanced");

    expect(entitlement.features.real_price).toBe(true);
    expect(entitlement.features.nearby_market).toBe(true);
    expect(entitlement.features.location_map).toBe(true);
    expect(entitlement.features.cadastral_map).toBe(true);
    expect(entitlement.features.aerial_photo).toBe(true);
    expect(entitlement.features.street_view_reference).toBe(true);
    expect(entitlement.features.floor_plan_processing).toBe(true);
    expect(entitlement.features.marketing_modules).toBe(true);
  });
});
