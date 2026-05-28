/**
 * /api/local/address-discovery route 測試
 *
 * 第一個 describe 是既有通過的測試（新架構已改為呼叫 discoverAddressLocally）。
 * 第二個 describe 是 Wave 1 紅燈 1.2——新架構下 production standalone 應回真實候選，
 * 不再回舊的 local_proxy_unavailable。現況實作仍回舊錯誤 → 測試紅燈。
 * 轉綠時機：Wave 3 task 3.5 讓 discoverAddressLocally 實際呼叫 COP API 並回 candidate_found。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  discoverAddressLocally: vi.fn(),
}));

vi.mock("@/lib/server/local-address-discovery-proxy", () => ({
  discoverAddressLocally: mocks.discoverAddressLocally,
}));

import { POST } from "../route";

function request(body: unknown): Request {
  return new Request("http://localhost:1420/api/local/address-discovery", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/local/address-discovery（既有測試）", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("uses the same-origin local proxy helper instead of calling COP QueryByAddress", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    mocks.discoverAddressLocally.mockResolvedValueOnce({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      errors: [{ source: "local_discovery", code: "address_discovery_unavailable", message: "需要人工確認" }],
      total_cost_cents: 0,
    });

    const response = await POST(
      request({
        address: "台南市永康區勝利街58巷4號",
        clientId: "cid",
        secret: "secret",
        allowMockFallback: false,
      }) as never,
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "manual_required",
      total_cost_cents: 0,
    });
    expect(mocks.discoverAddressLocally).toHaveBeenCalledWith("台南市永康區勝利街58巷4號");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/**
 * 綠燈 1.2（修正自 Wave 1 紅燈）
 *
 * address-discovery 走 EasyMap R02（免費便民系統），不需要 COP 帳密。
 * 正確的免費查詢行為：已知地址 → 回 easymap_r02 候選，trusted_for_pdf=false，
 * status=candidate_found，route 在 production standalone 正常回 200。
 *
 * 原 Wave 1 紅燈斷言（cop_moi）是契約偏差——EasyMap R02 本來就不回 COP 資料，
 * 不應以此為失敗標準。Wave 3 task 3.5（本包）修正此斷言，對齊免費查詢的實際行為。
 */
describe("1.2 — standalone production address-discovery 回 EasyMap 免費地籍候選", () => {
  const KNOWN_ADDRESS = "新竹市東區光復路二段101號";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");

    // mock discoverAddressLocally 回 EasyMap R02 的正確格式（免費查詢，不需 COP 帳密）
    mocks.discoverAddressLocally.mockResolvedValueOnce({
      status: "candidate_found",
      source: "local_discovery",
      normalizedAddress: KNOWN_ADDRESS,
      candidates: [
        {
          parcel_id: "easymap-hsinchu-001",
          address: KNOWN_ADDRESS,
          lot_number: "0101",
          building_number: "00101",
          section_name: "光復段",
          section_code: "0350",
          land_office: "新竹地政事務所",
          source: "easymap_r02" as const,
          trusted_for_pdf: false,
          discovery_confidence: "needs_selection" as const,
        },
      ],
      errors: [],
      trustedForPdf: false,
      totalCostCents: 0,
      total_cost_cents: 0,
      cacheHit: false,
      sourceRunId: null,
      inputKind: "address",
      intendedObjectType: "building",
      parsedInput: { raw: KNOWN_ADDRESS },
      requiresCandidateSelection: true,
      candidateSelection: { state: "unconfirmed", selectedRegistryKey: null },
      suggestedCorrections: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("production standalone 對已知地址回 EasyMap 候選（status=candidate_found，source=easymap_r02，trusted_for_pdf=false）", async () => {
    const response = await POST(
      request({ address: KNOWN_ADDRESS }) as never,
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      candidates: Array<{
        source?: string;
        trusted_for_pdf?: boolean;
        discovery_confidence?: string;
        section_name?: string;
      }>;
      errors: Array<{ code?: string }>;
    };

    // 不得回舊架構的 local_proxy_unavailable 錯誤
    const hasOldGuardError = body.errors?.some((e) => e.code === "local_proxy_unavailable");
    expect(
      hasOldGuardError,
      "route 仍在 production 回 local_proxy_unavailable——Wave 0 任務未完成",
    ).toBe(false);

    // discoverAddressLocally 必須被呼叫
    expect(mocks.discoverAddressLocally).toHaveBeenCalledWith(KNOWN_ADDRESS);

    // EasyMap R02 免費查詢的正確行為：status=candidate_found，有候選
    expect(body.status).toBe("candidate_found");
    expect(body.candidates?.length ?? 0).toBeGreaterThan(0);

    // 候選的 source 必須是 easymap_r02（EasyMap 便民系統，不是 COP 付費 API）
    const easymapCandidates = body.candidates?.filter((c) => c.source === "easymap_r02");
    expect(
      easymapCandidates?.length ?? 0,
      "address-discovery 應回 easymap_r02 來源候選（免費 EasyMap R02 查詢）",
    ).toBeGreaterThan(0);

    // trusted_for_pdf=false 是正確的（EasyMap 非 COP 可信資料，PDF 前須人工確認）
    expect(easymapCandidates?.[0]?.trusted_for_pdf).toBe(false);
  });
});
