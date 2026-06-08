import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pullFormalRegistryLocally: vi.fn(),
}));

vi.mock("@/lib/server/local-formal-pull-proxy", () => ({
  pullFormalRegistryLocally: mocks.pullFormalRegistryLocally,
}));

import {
  __resetAireCopCredentialStoreForTests,
  saveAireCopCredential,
} from "@/lib/server/aire-cop-credential-store";
import {
  __resetAireCopQueryLedgerForTests,
  listAireCopQueryLedgerRecords,
} from "@/lib/server/aire-cop-query-ledger";
import { POST } from "../formal-lookup/route";

function request(body: Record<string, unknown>, workspaceId = "workspace-abc") {
  return new Request("https://aire.opcos.me/api/aire/cop/formal-lookup", {
    method: "POST",
    headers: {
      Authorization: "Bearer aire_session_workspace_abc_agent_device_001",
      "x-aire-workspace-id": workspaceId,
      "x-aire-user-email": "agent@example.com",
    },
    body: JSON.stringify(body),
  });
}

const confirmedRegistryKey = {
  office: "中山",
  section: "吉林段",
  landNo: "0123-0000",
  buildingNo: "0456-000",
};

describe("AIRE COP formal lookup API", () => {
  beforeEach(() => {
    __resetAireCopCredentialStoreForTests();
    __resetAireCopQueryLedgerForTests();
    mocks.pullFormalRegistryLocally.mockReset();
  });

  it("rejects address-only formal lookup with 422 before upstream COP call", async () => {
    const response = await POST(request({ caseId: "case-1001", address: "台北市中山區吉林路1號" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: "confirmed_registry_key_required",
      required: ["office", "section", "landNo"],
    });
    expect(mocks.pullFormalRegistryLocally).not.toHaveBeenCalled();
  });

  it("rejects building lookup without buildingNo with 422 before upstream COP call", async () => {
    const response = await POST(
      request({
        caseId: "case-1001",
        registryKey: { office: "中山", section: "吉林段", landNo: "0123-0000" },
        apiIds: ["building_registry"],
        ownerAuthorizationId: "auth-7788",
        paidConsentId: "consent-7788",
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: "building_no_required" });
    expect(mocks.pullFormalRegistryLocally).not.toHaveBeenCalled();
  });

  it("rejects missing customer COP credential with 409 blocker", async () => {
    const response = await POST(
      request({
        caseId: "case-1001",
        registryKey: confirmedRegistryKey,
        apiIds: ["land_registry"],
        ownerAuthorizationId: "auth-7788",
        paidConsentId: "consent-7788",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ blocker: "missing_cop_credential" });
    expect(mocks.pullFormalRegistryLocally).not.toHaveBeenCalled();
    await expect(listAireCopQueryLedgerRecords("workspace-abc")).resolves.toMatchObject([
      {
        caseId: "case-1001",
        status: "blocked",
        blockerCode: "missing_cop_credential",
        actualCost: 0,
        cacheHit: false,
      },
    ]);
  });

  it("rejects missing paid consent with 409 before upstream COP call", async () => {
    await saveAireCopCredential({
      workspaceId: "workspace-abc",
      clientId: "cop-client-001",
      clientSecret: "super-secret-123",
    });

    const response = await POST(
      request({
        caseId: "case-1001",
        registryKey: confirmedRegistryKey,
        apiIds: ["land_registry"],
        ownerAuthorizationId: "auth-7788",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ blocker: "missing_paid_consent" });
    expect(mocks.pullFormalRegistryLocally).not.toHaveBeenCalled();
  });

  it("accepts legacy browser payload shape with caseLocalId, registryKey string, and consentId", async () => {
    await saveAireCopCredential({
      workspaceId: "workspace-abc",
      clientId: "cop-client-001",
      clientSecret: "super-secret-123",
    });
    mocks.pullFormalRegistryLocally.mockResolvedValue({
      run_id: "local-web-legacy-001",
      results: {
        land_registry: {
          success: true,
          data: { section: "吉林段", landNo: "0123-0000" },
          source: "api",
        },
      },
      total_cost: 1,
      cache_hit: false,
      source_run_id: null,
    });

    const response = await POST(
      request({
        caseLocalId: "case-legacy-1001",
        registryKey: "中山-吉林段-0123-0000-0456-000",
        apiIds: ["land_registry"],
        ownerAuthorizationId: "auth-legacy-7788",
        consentId: "consent-legacy-7788",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.pullFormalRegistryLocally).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: "case-legacy-1001",
        target: expect.objectContaining({
          office_code: "中山",
          section_code: "吉林段",
          land_no: "0123-0000",
          building_no: "0456-000",
        }),
      }),
    );
  });

  it("runs formal lookup with stored workspace credential and returns sanitized result/cost/provenance", async () => {
    await saveAireCopCredential({
      workspaceId: "workspace-abc",
      clientId: "cop-client-001",
      clientSecret: "super-secret-123",
    });
    mocks.pullFormalRegistryLocally.mockResolvedValue({
      run_id: "local-web-001",
      results: {
        land_registry: {
          success: true,
          data: { section: "吉林段", landNo: "0123-0000" },
          source: "api",
        },
      },
      total_cost: 1,
      cache_hit: false,
      source_run_id: null,
    });

    const response = await POST(
      request({
        caseId: "case-1001",
        registryKey: confirmedRegistryKey,
        apiIds: ["land_registry"],
        ownerAuthorizationId: "auth-7788",
        paidConsentId: "consent-7788",
        clientSecret: "malicious-browser-secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.pullFormalRegistryLocally).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: "case-1001",
        clientId: "cop-client-001",
        secret: "super-secret-123",
      }),
    );
    const body = await response.json();
    expect(body).toMatchObject({
      status: "success",
      runId: expect.stringMatching(/^aire-cop-/),
      cacheHit: false,
      sourceRunId: null,
      costSummary: { estimatedCost: 1, actualCost: 1 },
      provenance: { source: "正式 COP", sourceRunId: expect.any(String) },
    });
    expect(body.lineItems[0]).toMatchObject({
      apiCode: "land_registry",
      serviceCode: "MOI_API_001",
      unitPrice: 1,
      quantity: 1,
      estimatedCost: 1,
      failedRequestBilling: "possible",
    });
    const serialized = JSON.stringify(body).toLowerCase();
    expect(serialized).not.toContain("super-secret-123");
    expect(serialized).not.toContain("malicious-browser-secret");
    expect(serialized).not.toContain("access_token");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("bearer ");
    const ledgerRecords = await listAireCopQueryLedgerRecords("workspace-abc");
    expect(ledgerRecords).toHaveLength(1);
    expect(ledgerRecords[0]).toMatchObject({
      runId: body.runId,
      caseId: "case-1001",
      registryKey: "中山-吉林段-0123-0000-0456-000",
      apiCodes: ["land_registry"],
      status: "success",
      estimatedCost: 1,
      actualCost: 1,
      cacheHit: false,
      sourceRunId: null,
      sanitizedRequestJson: expect.objectContaining({
        caseId: "case-1001",
      }),
      sanitizedResponseJson: expect.objectContaining({
        status: "success",
        runId: body.runId,
      }),
    });
    expect(JSON.stringify(ledgerRecords[0]).toLowerCase()).not.toContain("super-secret-123");
    expect(JSON.stringify(ledgerRecords[0]).toLowerCase()).not.toContain("malicious-browser-secret");
  });
});
