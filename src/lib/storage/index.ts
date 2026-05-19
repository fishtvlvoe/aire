import type { StorageAdapter } from "./StorageAdapter";
import { MockStorageAdapter } from "./MockStorageAdapter";

// TauriStorageAdapter 留待下一個 change 實作
class TauriStorageAdapter implements StorageAdapter {
  private notImplemented(): never {
    throw new Error("TauriStorageAdapter not implemented");
  }
  getBranding() { return this.notImplemented(); }
  saveBranding() { return this.notImplemented(); }
  getCaseDisclosures() { return this.notImplemented(); }
  saveCaseDisclosures() { return this.notImplemented(); }
  getKeyinData() { return this.notImplemented(); }
  saveKeyinData() { return this.notImplemented(); }
  getAppSettings() { return this.notImplemented(); }
  saveAppSettings() { return this.notImplemented(); }
}

function createStorage(): StorageAdapter {
  if (typeof window !== "undefined" && (window as Window & { __TAURI__?: unknown }).__TAURI__) {
    return new TauriStorageAdapter();
  }
  return new MockStorageAdapter();
}

export const storage: StorageAdapter = createStorage();
export type { StorageAdapter, BrandingData, DisclosureData, KeyinData, AppSettings } from "./StorageAdapter";
