import { contextBridge, ipcRenderer } from 'electron';

/** 對渲染層暴露的安全 API（不直接暴露 Node.js 模組） */
contextBridge.exposeInMainWorld('electronAPI', {
  /** 取得 App 版本 */
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),

  /** 手動觸發更新檢查 */
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('updater:check'),

  /** 監聽更新進度事件 */
  onUpdateStatus: (
    callback: (event: { status: string; progress?: number; message?: string }) => void,
  ) => {
    ipcRenderer.on('update:status', (_e, payload) => callback(payload as Parameters<typeof callback>[0]));
    return () => ipcRenderer.removeAllListeners('update:status');
  },

  /** 開啟系統瀏覽器（用於 OAuth 授權） */
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  /** 取得已儲存的 OpenAI token */
  getOpenAIToken: (): Promise<{ token: string } | null> => ipcRenderer.invoke('openai:getToken'),

  /** 儲存 OpenAI token */
  saveOpenAIToken: (token: string): Promise<void> => ipcRenderer.invoke('openai:saveToken', token),

  /** 監聽 OAuth callback 後傳入的 token */
  onOpenAITokenReceived: (
    callback: (e: { token: string }) => void,
  ) => {
    ipcRenderer.on('openai:tokenReceived', (_e, payload) => callback(payload as Parameters<typeof callback>[0]));
    return () => ipcRenderer.removeAllListeners('openai:tokenReceived');
  },
});
