import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildMoiServiceCatalogFromScrape,
  getCoverageDecision,
  getMoiServiceCatalogEntry,
  parsePricePolicy,
} from "../moi-service-catalog";

describe("moi-service-catalog", () => {
  it("parses local scrape artifacts into catalog entries", () => {
    const pricing = JSON.parse(
      readFileSync("docs/cop-scrape/02-服務列表/pricing.json", "utf8"),
    );
    const merged = JSON.parse(
      readFileSync("docs/cop-scrape/02-服務列表/merged_services.json", "utf8"),
    );

    const catalog = buildMoiServiceCatalogFromScrape(merged);
    const sourceRow = pricing.find((row: { serviceName: string }) => row.serviceName.includes("MOI_API_007"));
    const entry = catalog.find((row) => row.serviceCode === "MOI_API_007");

    expect(sourceRow).toBeTruthy();
    expect(entry).toMatchObject({
      serviceCode: "MOI_API_007",
      pricePolicy: "price_by_location",
      unitPrice: 10,
    });
    expect(parsePricePolicy(sourceRow.priceDescribeUser)).toBe("price_by_location");
  });

  it("keeps restricted services blocked and unknown pricing unresolved", () => {
    expect(getMoiServiceCatalogEntry("MOI_API_009")).toMatchObject({
      implementationPriority: "restricted",
      pricePolicy: "restricted",
    });
    expect(getCoverageDecision(["MOI_API_009"]).status).toBe("restricted");
  });

  it("treats required services as integrated coverage", () => {
    expect(getCoverageDecision(["MOI_API_005"]).status).toBe("integrated");
    expect(getMoiServiceCatalogEntry("MOI_API_014")).toMatchObject({
      pricePolicy: "auth_free",
    });
  });

  it("marks mixed known and unknown dependencies as missing", () => {
    expect(getCoverageDecision(["MOI_API_014", "MOI_WMS_005"])).toMatchObject({
      status: "missing",
    });
  });
});
