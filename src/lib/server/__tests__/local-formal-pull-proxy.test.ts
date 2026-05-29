import { afterEach, describe, expect, it, vi } from "vitest";

import { pullFormalRegistryLocally } from "@/lib/server/local-formal-pull-proxy";

describe("pullFormalRegistryLocally", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses office_code and section_code for COP payload instead of sending land_no as sec", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          STATUS: 1,
          RESPONSE: [{ BLDGREG: { NO: "07193000" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await pullFormalRegistryLocally({
      caseId: "case-001",
      apiIds: ["building_registry"],
      clientId: "cid",
      secret: "sec",
      target: {
        office_code: "OA",
        section_code: "0052",
        section_name: "武陵段",
        land_no: "07192000",
        building_no: "07193000",
        registry_key: "OA-0052-07193000",
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual([
      expect.objectContaining({
        unit: "OA",
        sec: "0052",
        no: "07193000",
      }),
    ]);
  });
});
