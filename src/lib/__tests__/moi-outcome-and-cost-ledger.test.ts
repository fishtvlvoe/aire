import { describe, expect, it } from "vitest";

import {
  buildUsageLedgerRecordFromOutcome,
  calculateBillableAmount,
  classifyMoiOutcome,
  summarizeUsageLedger,
} from "../moi-outcome-and-cost-ledger";
import { getMoiServiceCatalogEntry } from "../moi-service-catalog";

describe("moi-outcome-and-cost-ledger", () => {
  it("classifies COP309 as a domain failure", () => {
    expect(
      classifyMoiOutcome({
        httpStatus: 200,
        moiStatus: 0,
        moiCode: "COP309",
        returnRows: 0,
        parseOk: true,
      }),
    ).toBe("domain_failure");
  });

  it("does not require parseOk for successful responses and keeps restricted failures explicit", () => {
    expect(
      classifyMoiOutcome({
        httpStatus: 200,
        moiStatus: 1,
        returnRows: 1,
      }),
    ).toBe("moi_success");

    expect(
      classifyMoiOutcome({
        httpStatus: 200,
        restricted: true,
      }),
    ).toBe("restricted_failure");
  });

  it("calculates row-based cost and keeps failed calls at zero", () => {
    const catalogEntry = getMoiServiceCatalogEntry("MOI_API_005");
    expect(catalogEntry).toBeTruthy();
    expect(
      calculateBillableAmount({
        catalogEntry: catalogEntry!,
        outcome: "moi_success",
        returnRows: 27,
      }),
    ).toBe(27);
    expect(
      calculateBillableAmount({
        catalogEntry: catalogEntry!,
        outcome: "domain_failure",
        returnRows: 27,
      }),
    ).toBe(0);
  });

  it("records failed calls and summarizes totals", () => {
    const successEntry = getMoiServiceCatalogEntry("MOI_API_005")!;
    const failureEntry = getMoiServiceCatalogEntry("MOI_API_037")!;
    const records = [
      buildUsageLedgerRecordFromOutcome({
        catalogEntry: successEntry,
        serviceCode: "MOI_API_005",
        requestFingerprint: "fp-1",
        startedAt: "2026-05-24T00:00:00.000Z",
        finishedAt: "2026-05-24T00:00:01.000Z",
        outcome: "moi_success",
        transactionId: "08d28190",
        httpStatus: 200,
        moiStatus: 1,
        moiCode: "OK",
        moiMessage: "success",
        returnRows: 27,
      }),
      buildUsageLedgerRecordFromOutcome({
        catalogEntry: failureEntry,
        serviceCode: "MOI_API_037",
        requestFingerprint: "fp-2",
        startedAt: "2026-05-24T00:01:00.000Z",
        finishedAt: "2026-05-24T00:01:01.000Z",
        outcome: "domain_failure",
        transactionId: "08d28191",
        httpStatus: 200,
        moiStatus: 0,
        moiCode: "COP309",
        moiMessage: "no data",
        returnRows: 0,
      }),
    ];

    expect(records[1]).toMatchObject({
      serviceCode: "MOI_API_037",
      outcome: "domain_failure",
      moiCode: "COP309",
      transactionId: "08d28191",
      billableAmount: 0,
    });

    expect(summarizeUsageLedger(records)).toMatchObject({
      totalCalls: 2,
      successfulCalls: 1,
      failedCalls: 1,
      totalReturnRows: 27,
      unpaidAmount: 27,
    });
  });
});
