/**
 * TDD RED → GREEN 測試
 * Bug#4, Bug#5, Bug NEW-2: MockStorageAdapter 持久化行為
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockStorageAdapter } from "../MockStorageAdapter";

const STORE_KEY = "aire-mock-store";

function createMockLocalStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear() { data.clear(); },
    getItem(key: string) { return data.has(key) ? data.get(key)! : null; },
    key(index: number) { return [...data.keys()][index] ?? null; },
    removeItem(key: string) { data.delete(key); },
    setItem(key: string, value: string) { data.set(key, value); },
  };
}

let originalLocalStorage: PropertyDescriptor | undefined;

beforeEach(() => {
  originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: createMockLocalStorage(),
  });
});

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  } else {
    Reflect.deleteProperty(window, "localStorage");
  }
});

function getStore(): Record<string, unknown> {
  const raw = window.localStorage.getItem(STORE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

describe("MockStorageAdapter — 初始化", () => {
  it("新建時補齊 branding/disclosures/keyin_data 三個缺失 key", () => {
    new MockStorageAdapter();
    const store = getStore();
    expect(Object.prototype.hasOwnProperty.call(store, "branding")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(store, "disclosures")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(store, "keyin_data")).toBe(true);
  });
});

describe("MockStorageAdapter — getBranding / saveBranding (Bug#5)", () => {
  it("getBranding 返回 null（無資料時）", async () => {
    const adapter = new MockStorageAdapter();
    expect(await adapter.getBranding()).toBeNull();
  });

  it("saveBranding 後 getBranding 返回已存資料", async () => {
    const adapter = new MockStorageAdapter();
    const data = { agentName: "王小明", companyName: "大安不動產", agentCertNo: "A-123" } as const;
    await adapter.saveBranding(data);
    expect(await adapter.getBranding()).toEqual(data);
  });

  it("saveBranding 寫入 aire-mock-store.branding", async () => {
    const adapter = new MockStorageAdapter();
    const data = { agentName: "王小明", companyName: "大安不動產", agentCertNo: "A-123" } as const;
    await adapter.saveBranding(data);
    const store = getStore();
    expect(store.branding).toEqual(data);
  });
});

describe("MockStorageAdapter — getCaseDisclosures / saveCaseDisclosures (Bug#4)", () => {
  const caseId = "11111111-1111-4111-8111-111111111111";

  it("getCaseDisclosures 返回 null（無資料時）", async () => {
    const adapter = new MockStorageAdapter();
    expect(await adapter.getCaseDisclosures(caseId)).toBeNull();
  });

  it("saveCaseDisclosures 後 getCaseDisclosures 返回已存資料", async () => {
    const adapter = new MockStorageAdapter();
    const data = { conditionLeakage: true, conditionRenovation: false, conditionIllegalStructure: false };
    await adapter.saveCaseDisclosures(caseId, data);
    expect(await adapter.getCaseDisclosures(caseId)).toEqual(data);
  });

  it("saveCaseDisclosures 寫入 disclosures[caseId].conditionLeakage", async () => {
    const adapter = new MockStorageAdapter();
    const data = { conditionLeakage: true, conditionRenovation: false, conditionIllegalStructure: false };
    await adapter.saveCaseDisclosures(caseId, data);
    const store = getStore();
    const disclosures = store.disclosures as Record<string, unknown>;
    expect((disclosures[caseId] as Record<string, unknown>).conditionLeakage).toBe(true);
  });
});

describe("MockStorageAdapter — getKeyinData / saveKeyinData (Bug NEW-2)", () => {
  const caseId = "11111111-1111-4111-8111-111111111111";

  it("getKeyinData 返回 null（無資料時）", async () => {
    const adapter = new MockStorageAdapter();
    expect(await adapter.getKeyinData(caseId)).toBeNull();
  });

  it("saveKeyinData 後 getKeyinData 返回已存資料", async () => {
    const adapter = new MockStorageAdapter();
    const data = { buildingLotNo: "TEST-001", savedAt: "2026-05-19T10:00:00Z" };
    await adapter.saveKeyinData(caseId, data);
    expect(await adapter.getKeyinData(caseId)).toEqual(data);
  });

  it("saveKeyinData 寫入 keyin_data[caseId]", async () => {
    const adapter = new MockStorageAdapter();
    const data = { buildingLotNo: "TEST-001", savedAt: "2026-05-19T10:00:00Z" };
    await adapter.saveKeyinData(caseId, data);
    const store = getStore();
    const keyinData = store.keyin_data as Record<string, unknown>;
    expect(keyinData[caseId]).toEqual(data);
  });
});
