import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomerCopBackendApp,
  createFirestoreCustomerCopStore,
  createMemoryCustomerCopStore,
  createProductionCustomerCopBackendApp,
  type CopFetch,
} from "./app";
import { signAireBrowserToken } from "../../src/lib/server/aire-browser-session-token";

const AUTH_HEADERS = {
  Authorization: "Bearer aire_session_test",
  "x-aire-workspace-id": "ws-a",
  "x-aire-user-email": "user@aire.test",
  Origin: "https://aire-browser.opcos.me",
};

function request(path: string, init: RequestInit = {}) {
  return new Request(`https://cop-backend.test${path}`, {
    ...init,
    headers: {
      ...AUTH_HEADERS,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("customer COP backend contract", () => {
  let store: ReturnType<typeof createMemoryCustomerCopStore>;
  let copFetch: ReturnType<typeof vi.fn<CopFetch>>;

  beforeEach(() => {
    store = createMemoryCustomerCopStore({
      encryptionKey: "0123456789abcdef0123456789abcdef",
    });
    copFetch = vi.fn<CopFetch>();
  });

  function app() {
    return createCustomerCopBackendApp({
      store,
      copFetch,
      allowedOrigins: ["https://aire-browser.opcos.me"],
      now: () => new Date("2026-06-05T08:00:00.000Z"),
      id: () => "run-001",
    });
  }

  it("Deployed customer COP backend SHALL expose production API routes", async () => {
    const response = await app().fetch(request("/api/aire/cop/health", { method: "GET" }));
    await expect(json(response)).resolves.toMatchObject({
      ok: true,
      service: "customer-cop-backend",
    });
    expect(response.status).toBe(200);
  });

  it("Backend SHALL store workspace COP credentials encrypted server-side", async () => {
    const save = await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    const body = await json(save);

    expect(save.status).toBe(200);
    expect(body).toMatchObject({
      workspaceId: "ws-a",
      clientId: "client-a",
      secretMasked: "****et-a",
      lastTestStatus: "not_tested",
    });
    expect(JSON.stringify(body)).not.toContain("secret-a");
    expect(store.__debugDump().credentials.get("ws-a")?.secretCiphertext).not.toContain("secret-a");
  });

  it("Backend SHALL reject missing workspace and empty credential input", async () => {
    const missingWorkspace = await app().fetch(new Request("https://cop-backend.test/api/aire/cop/credential", {
      method: "POST",
      headers: {
        Authorization: "Bearer aire_session_test",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    expect(missingWorkspace.status).toBe(403);
    expect(store.__debugDump().credentials.size).toBe(0);

    const empty = await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "", clientSecret: "" }),
    }));
    expect(empty.status).toBe(400);
    expect(store.__debugDump().credentials.size).toBe(0);
  });

  it("Backend SHALL test COP credentials without exposing tokens", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    copFetch.mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token-secret", expires_in: 300 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    const response = await app().fetch(request("/api/aire/cop/credential/test", { method: "POST" }));
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, expiresInSeconds: 300 });
    expect(JSON.stringify(body)).not.toContain("token-secret");
  });

  it("token timeout is retryable and does not invalidate credential", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    copFetch.mockRejectedValueOnce(new Error("timeout"));

    const response = await app().fetch(request("/api/aire/cop/credential/test", { method: "POST" }));
    const body = await json(response);

    expect(response.status).toBe(502);
    expect(body).toMatchObject({ ok: false, errorCode: "cop_token_timeout", retryable: true });
    expect(store.__debugDump().credentials.get("ws-a")?.lastTestStatus).toBe("not_tested");
  });

  it("Backend SHALL execute formal lookup only after server-side prerequisites", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));

    const missingConsent = await app().fetch(request("/api/aire/cop/formal-lookup", {
      method: "POST",
      body: JSON.stringify({
        caseLocalId: "case-001",
        registryKey: "BA-0001-00020000",
        apiIds: ["land_description"],
        ownerAuthorizationId: "owner-auth-001",
      }),
    }));
    expect(missingConsent.status).toBe(409);
    await expect(json(missingConsent)).resolves.toMatchObject({ errorCode: "missing_paid_consent" });
    expect(copFetch).not.toHaveBeenCalled();
  });

  it("Deployed backend SHALL enforce paid consent before formal COP calls when catalog price is missing", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    const noPriceApp = createCustomerCopBackendApp({
      store,
      copFetch,
      allowedOrigins: ["https://aire-browser.opcos.me"],
      now: () => new Date("2026-06-05T08:00:00.000Z"),
      id: () => "run-001",
      priceCatalog: {},
    });

    const response = await noPriceApp.fetch(request("/api/aire/cop/formal-lookup", {
      method: "POST",
      body: JSON.stringify({
        caseLocalId: "case-001",
        registryKey: "BA-0001-00020000",
        apiIds: ["land_description"],
        consentId: "consent-001",
        ownerAuthorizationId: "owner-auth-001",
      }),
    }));

    expect(response.status).toBe(409);
    await expect(json(response)).resolves.toMatchObject({ errorCode: "missing_catalog_price" });
    expect(copFetch).not.toHaveBeenCalled();
  });

  it("approved formal lookup writes durable sanitized query ledger rows", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    copFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token-secret", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        STATUS: 1,
        PRICE: 1,
        QUANTITY: 1,
        TRANSACTIONID: "tx-001",
        RETURNROWS: 1,
        RESPONSE: [{ UNIT: "BA", SEC: "0001", NO: "00020000", LANDREG: { AREA: "72.00" } }],
      }), { status: 200 }));

    const response = await app().fetch(request("/api/aire/cop/formal-lookup", {
      method: "POST",
      body: JSON.stringify({
        caseLocalId: "case-001",
        registryKey: "BA-0001-00020000",
        apiIds: ["land_description"],
        consentId: "consent-001",
        ownerAuthorizationId: "owner-auth-001",
      }),
    }));
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      runId: "run-001",
      status: "success",
      cacheHit: false,
      costSummary: { actualPrice: 1, actualQuantity: 1 },
    });

    const ledger = await app().fetch(request("/api/aire/cop/query-ledger?caseLocalId=case-001", { method: "GET" }));
    const ledgerBody = await json(ledger);
    expect(ledgerBody.records).toMatchObject([
      {
        runId: "run-001",
        caseLocalId: "case-001",
        registryKey: "BA-0001-00020000",
        status: "success",
        totalPrice: 1,
        totalQuantity: 1,
        transactionIds: ["tx-001"],
      },
    ]);
    expect(JSON.stringify(ledgerBody)).not.toContain("secret-a");
    expect(JSON.stringify(ledgerBody)).not.toContain("token-secret");
  });

  it("formal lookup supports building registry and ownership api set with building number in registry key", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));
    copFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token-secret", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        STATUS: 1,
        PRICE: 1,
        QUANTITY: 1,
        TRANSACTIONID: "tx-building-reg",
        RESPONSE: [{ BLDGREG: { NO: "00030000", AREA: "84.13" } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        STATUS: 1,
        PRICE: 1,
        QUANTITY: 1,
        TRANSACTIONID: "tx-building-own",
        RESPONSE: [{ BLDGOWNERSHIP: [{ OWNER: { LNAME: "王小明" } }] }],
      }), { status: 200 }));

    const response = await app().fetch(request("/api/aire/cop/formal-lookup", {
      method: "POST",
      body: JSON.stringify({
        caseLocalId: "case-building-001",
        registryKey: "BA-0001-00020000-00030000",
        apiIds: ["building_registry", "building_ownership"],
        consentId: "consent-001",
        ownerAuthorizationId: "owner-auth-001",
      }),
    }));
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      runId: "run-001",
      status: "success",
      sanitizedResult: {
        building_registry: expect.objectContaining({ STATUS: 1 }),
        building_ownership: expect.objectContaining({ STATUS: 1 }),
      },
      costSummary: {
        actualPrice: 2,
        actualQuantity: 2,
        plannedLineItems: [
          expect.objectContaining({ apiId: "building_registry" }),
          expect.objectContaining({ apiId: "building_ownership" }),
        ],
      },
    });
    expect(copFetch).toHaveBeenNthCalledWith(2,
      "https://copapi.moi.gov.tw/cp/api/BuildingDescription/1.0/QueryByBuildNo",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify([{ unit: "BA", sec: "0001", no: "00030000" }]),
      }),
    );
    expect(copFetch).toHaveBeenNthCalledWith(3,
      "https://copapi.moi.gov.tw/cp/api/BuildingOwnership/1.0/QueryByLimit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify([{ unit: "BA", sec: "0001", no: "00030000", offset: 1, limit: 100 }]),
      }),
    );
  });

  it("formal lookup rejects building api set without building number", async () => {
    await app().fetch(request("/api/aire/cop/credential", {
      method: "POST",
      body: JSON.stringify({ clientId: "client-a", clientSecret: "secret-a" }),
    }));

    const response = await app().fetch(request("/api/aire/cop/formal-lookup", {
      method: "POST",
      body: JSON.stringify({
        caseLocalId: "case-building-001",
        registryKey: "BA-0001-00020000",
        apiIds: ["building_registry"],
        consentId: "consent-001",
        ownerAuthorizationId: "owner-auth-001",
      }),
    }));

    expect(response.status).toBe(422);
    await expect(json(response)).resolves.toMatchObject({ errorCode: "building_no_required" });
    expect(copFetch).not.toHaveBeenCalled();
  });

  it("secret marker blocks ledger persistence", async () => {
    await expect(store.writeLedger({
      runId: "run-secret",
      workspaceId: "ws-a",
      caseLocalId: "case-001",
      registryKey: "BA-0001-00020000",
      apiIds: ["land_description"],
      status: "success",
      totalPrice: 1,
      totalQuantity: 1,
      transactionIds: ["tx-001"],
      sanitizedRequestJson: { authorization: "Bearer token-secret" },
      sanitizedResponseJson: {},
      createdAt: "2026-06-05T08:00:00.000Z",
    })).rejects.toThrow("ledger_secret_payload_rejected");
  });

  it("ledger is workspace isolated", async () => {
    await store.writeLedger({
      runId: "run-a",
      workspaceId: "ws-a",
      caseLocalId: "case-001",
      registryKey: "BA-0001-00020000",
      apiIds: ["land_description"],
      status: "success",
      totalPrice: 1,
      totalQuantity: 1,
      transactionIds: ["tx-a"],
      sanitizedRequestJson: {},
      sanitizedResponseJson: {},
      createdAt: "2026-06-05T08:00:00.000Z",
    });
    await store.writeLedger({
      runId: "run-b",
      workspaceId: "ws-b",
      caseLocalId: "case-001",
      registryKey: "BA-0002-00030000",
      apiIds: ["land_description"],
      status: "success",
      totalPrice: 1,
      totalQuantity: 1,
      transactionIds: ["tx-b"],
      sanitizedRequestJson: {},
      sanitizedResponseJson: {},
      createdAt: "2026-06-05T08:00:00.000Z",
    });

    const ledger = await app().fetch(request("/api/aire/cop/query-ledger?caseLocalId=case-001", { method: "GET" }));
    const body = await json(ledger);
    expect(JSON.stringify(body)).toContain("BA-0001-00020000");
    expect(JSON.stringify(body)).not.toContain("BA-0002-00030000");
  });

  it("Gateway and backend SHALL enforce CORS for AIRE Browser origins", async () => {
    const allowed = await app().fetch(request("/api/aire/cop/health", { method: "OPTIONS" }));
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://aire-browser.opcos.me");

    const rejected = await app().fetch(new Request("https://cop-backend.test/api/aire/cop/health", {
      method: "GET",
      headers: { ...AUTH_HEADERS, Origin: "https://evil.example" },
    }));
    expect(rejected.status).toBe(403);
  });
});

describe("customer COP backend deployability", () => {
  it("production app refuses to boot without required deployment secrets", () => {
    expect(() => createProductionCustomerCopBackendApp({
      env: {},
      copFetch: vi.fn<CopFetch>(),
    })).toThrow("customer_cop_backend_deploy_config_invalid");
  });

  it("production app boots with deploy env and exposes health route", async () => {
    const app = createProductionCustomerCopBackendApp({
      env: {
        AIRE_COP_CREDENTIAL_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef",
        AIRE_COP_BACKEND_SHARED_TOKEN: "backend-token",
        AIRE_BROWSER_SESSION_JWT_SECRET: "browser-token-secret",
        AIRE_COP_ALLOWED_ORIGINS: "https://aire-browser.opcos.me",
      },
      store: createMemoryCustomerCopStore({ encryptionKey: "0123456789abcdef0123456789abcdef" }),
      copFetch: vi.fn<CopFetch>(),
    });

    const response = await app.fetch(new Request("https://cop-backend.test/api/aire/cop/health", {
      method: "GET",
      headers: { Origin: "https://aire-browser.opcos.me" },
    }));

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({
      ok: true,
      service: "customer-cop-backend",
    });

    const directCredential = await app.fetch(new Request("https://cop-backend.test/api/aire/cop/credential", {
      method: "GET",
      headers: AUTH_HEADERS,
    }));
    expect(directCredential.status).toBe(403);
    await expect(json(directCredential)).resolves.toMatchObject({ errorCode: "backend_gateway_required" });
  });

  it("production backend derives workspace from verified Browser token instead of forged workspace header", async () => {
    const store = createMemoryCustomerCopStore({ encryptionKey: "0123456789abcdef0123456789abcdef" });
    await store.saveCredential({
      workspaceId: "workspace-real",
      clientId: "client-a",
      clientSecret: "secret-a",
      now: "2026-06-05T08:00:00.000Z",
    });
    const token = signAireBrowserToken({
      secret: "browser-token-secret",
      subject: "user-123",
      email: "customer@example.com",
      workspaceId: "workspace-real",
      organizationId: "org-a",
      licenseId: "license-a",
      planId: "vip",
      deviceId: "device-a",
      features: ["browser", "customer-cop"],
    });
    const app = createCustomerCopBackendApp({
      store,
      copFetch: vi.fn<CopFetch>(),
      allowedOrigins: ["https://aire-browser.opcos.me"],
      backendSharedToken: "backend-token",
      browserSessionJwtSecret: "browser-token-secret",
    });

    const response = await app.fetch(new Request("https://cop-backend.test/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-aire-workspace-id": "workspace-forged",
        "x-aire-backend-token": "backend-token",
        Origin: "https://aire-browser.opcos.me",
      },
    }));

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({ workspaceId: "workspace-real" });
  });

  it("Firestore store persists encrypted credential and workspace-scoped ledger", async () => {
    const firestore = createFakeFirestore();
    const store = createFirestoreCustomerCopStore({
      firestore,
      encryptionKey: "0123456789abcdef0123456789abcdef",
      collectionPrefix: "test-cop",
    });

    const saved = await store.saveCredential({
      workspaceId: "ws-a",
      clientId: "client-a",
      clientSecret: "secret-a",
      now: "2026-06-05T08:00:00.000Z",
    });
    await store.updateCredentialTestState("ws-a", {
      status: "success",
      testedAt: "2026-06-05T08:01:00.000Z",
    });
    await store.writeLedger({
      runId: "run-a",
      workspaceId: "ws-a",
      caseLocalId: "case-001",
      registryKey: "BA-0001-00020000",
      apiIds: ["land_description"],
      status: "success",
      totalPrice: 1,
      totalQuantity: 1,
      transactionIds: ["tx-a"],
      sanitizedRequestJson: { registryKey: "BA-0001-00020000" },
      sanitizedResponseJson: { status: "success" },
      createdAt: "2026-06-05T08:02:00.000Z",
    });

    expect(saved.secretMasked).toBe("****et-a");
    await expect(store.readCredentialSecret("ws-a")).resolves.toMatchObject({
      clientId: "client-a",
      clientSecret: "secret-a",
    });
    await expect(store.readCredentialState("ws-a")).resolves.toMatchObject({
      lastTestStatus: "success",
      lastTestedAt: "2026-06-05T08:01:00.000Z",
    });
    await expect(store.listLedger("ws-a", "case-001")).resolves.toMatchObject([
      {
        runId: "run-a",
        workspaceId: "ws-a",
        caseLocalId: "case-001",
        totalPrice: 1,
      },
    ]);
    expect(JSON.stringify(firestore.__dump())).not.toContain("secret-a");
  });
});

function createFakeFirestore() {
  const collections = new Map<string, Map<string, Record<string, unknown>>>();
  const ensureCollection = (name: string) => {
    const existing = collections.get(name);
    if (existing) return existing;
    const created = new Map<string, Record<string, unknown>>();
    collections.set(name, created);
    return created;
  };

  return {
    collection(name: string) {
      const rows = ensureCollection(name);
      const queryState: { workspaceId?: string; limit?: number } = {};
      const collectionApi = {
        doc(id: string) {
          return {
            async get() {
              const row = rows.get(id);
              return {
                exists: Boolean(row),
                data: () => row,
                get: (field: string) => row?.[field],
              };
            },
            async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
              rows.set(id, options?.merge ? { ...(rows.get(id) ?? {}), ...value } : value);
            },
          };
        },
        where(field: string, operator: string, value: unknown) {
          if (field === "workspaceId" && operator === "==") queryState.workspaceId = String(value);
          return collectionApi;
        },
        limit(value: number) {
          queryState.limit = value;
          return collectionApi;
        },
        async get() {
          let docs = [...rows.values()];
          if (queryState.workspaceId) {
            docs = docs.filter((row) => row.workspaceId === queryState.workspaceId);
          }
          if (queryState.limit) docs = docs.slice(0, queryState.limit);
          return { docs: docs.map((row) => ({ data: () => row })) };
        },
      };
      return collectionApi;
    },
    __dump() {
      return Object.fromEntries([...collections.entries()].map(([name, rows]) => [name, Object.fromEntries(rows)]));
    },
  };
}
