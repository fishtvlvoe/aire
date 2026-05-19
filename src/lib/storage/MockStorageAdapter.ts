import type { AppSettings, BrandingData, DisclosureData, KeyinData, StorageAdapter } from "./StorageAdapter";

const STORE_KEY = "aire-mock-store";

interface MockStore {
  branding: BrandingData | null;
  disclosures: Record<string, DisclosureData>;
  keyin_data: Record<string, KeyinData>;
  [key: string]: unknown;
}

function readStore(): MockStore {
  if (typeof window === "undefined") {
    return { branding: null, disclosures: {}, keyin_data: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { branding: null, disclosures: {}, keyin_data: {} };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...parsed,
      branding: (parsed.branding as BrandingData | null | undefined) ?? null,
      disclosures: (parsed.disclosures as Record<string, DisclosureData> | undefined) ?? {},
      keyin_data: (parsed.keyin_data as Record<string, KeyinData> | undefined) ?? {},
    };
  } catch {
    return { branding: null, disclosures: {}, keyin_data: {} };
  }
}

function writeStore(store: MockStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export class MockStorageAdapter implements StorageAdapter {
  constructor() {
    // 補齊缺失的三個 key
    const store = readStore();
    writeStore(store);
  }

  async getBranding(): Promise<BrandingData | null> {
    return readStore().branding;
  }

  async saveBranding(data: BrandingData): Promise<void> {
    const store = readStore();
    store.branding = data;
    writeStore(store);
  }

  async getCaseDisclosures(caseId: string): Promise<DisclosureData | null> {
    return readStore().disclosures[caseId] ?? null;
  }

  async saveCaseDisclosures(caseId: string, data: DisclosureData): Promise<void> {
    const store = readStore();
    store.disclosures[caseId] = data;
    writeStore(store);
  }

  async getKeyinData(caseId: string): Promise<KeyinData | null> {
    return readStore().keyin_data[caseId] ?? null;
  }

  async saveKeyinData(caseId: string, data: KeyinData): Promise<void> {
    const store = readStore();
    store.keyin_data[caseId] = data;
    writeStore(store);
  }

  async getAppSettings(): Promise<AppSettings> {
    const store = readStore();
    const settings = store.appSettings as AppSettings | undefined;
    return settings ?? { landApi: { clientId: "", secret: "" } };
  }

  async saveAppSettings(settings: AppSettings): Promise<void> {
    const store = readStore();
    store.appSettings = settings;
    writeStore(store);
  }
}
