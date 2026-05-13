"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/** 對渲染層暴露的安全 API（不直接暴露 Node.js 模組） */
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    /** 取得 App 版本 */
    getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    /** 手動觸發更新檢查 */
    checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check'),
    /** 監聽更新進度事件 */
    onUpdateStatus: (callback) => {
        electron_1.ipcRenderer.on('update-status', (_e, payload) => callback(payload));
        return () => electron_1.ipcRenderer.removeAllListeners('update-status');
    },
    installUpdate: () => electron_1.ipcRenderer.invoke('updater:install'),
    /** 開啟系統瀏覽器（用於 OAuth 授權） */
    openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url),
    /** 取得已儲存的 OpenAI token */
    getOpenAIToken: () => electron_1.ipcRenderer.invoke('openai:getToken'),
    /** 儲存 OpenAI token */
    saveOpenAIToken: (token) => electron_1.ipcRenderer.invoke('openai:saveToken', token),
    /** 監聽 OAuth callback 後傳入的 token */
    onOpenAITokenReceived: (callback) => {
        electron_1.ipcRenderer.on('openai:tokenReceived', (_e, payload) => callback(payload));
        return () => electron_1.ipcRenderer.removeAllListeners('openai:tokenReceived');
    },
    detectCodex: (customPath) => electron_1.ipcRenderer.invoke('codex:detect', customPath),
    codexProceed: () => electron_1.ipcRenderer.invoke('codex:proceedToApp'),
});
