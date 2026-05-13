interface ElectronAPI {
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  onUpdateStatus: (
    callback: (event: { status: string; progress?: number; message?: string }) => void,
  ) => () => void;
  installUpdate: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  getOpenAIToken: () => Promise<{ token: string } | null>;
  saveOpenAIToken: (token: string) => Promise<void>;
  onOpenAITokenReceived: (cb: (e: { token: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
