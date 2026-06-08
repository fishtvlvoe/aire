import { describe, expect, it } from "vitest";
import { resolvePdfFallbackRow } from "@/components/workbench/DemoAlignedWorkbench";
import type { CaseRow } from "@/lib/cases-api";

const baseCase: CaseRow = {
  id: "case-001",
  case_no: "AIRE-CASE-001",
  case_name: "東和路 47 號",
  property_type: "residential",
  land_lot_no: "02210032",
  land_lots: ["02210032"],
  building_lot_no: "03045000",
  address: "台南市東區東和路47號3樓",
  owner_name: "測試屋主",
  status: "draft",
  created_at: 1700000000,
  updated_at: 1700000000,
};

describe("resolvePdfFallbackRow", () => {
  it("已保存免費附近行情時，不再把實價登錄行情列為待補", () => {
    const row = resolvePdfFallbackRow(
      {
        label: "實價登錄行情",
        value: "尚未取得附近成交行情",
        source: "附近成交行情",
        status: "待補",
        reason: "尚未保存同區段或周邊交易樣本。",
      },
      {
        assetUploads: {},
        savedLogo: null,
        caseDraft: {
          ...baseCase,
          land_registry_data: {
            schema: "aire.registry-provenance.v1",
            generatedAt: "2026-06-08T00:00:00.000Z",
            entries: {
              real_price_query: {
                apiId: "real_price_query",
                source: "public_candidate",
                status: "candidate",
                trustedForPdf: false,
                data: [{ address: "台南市東區東和路47號3樓", unit_price: 102641 }],
              },
            },
          },
        },
      },
    );

    expect(row).toMatchObject({
      value: "已取得 1 筆附近成交行情",
      source: "免費附近行情",
      status: "已取得",
      reason: "",
    });
  });
});
