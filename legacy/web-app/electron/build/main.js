"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
const launcher_1 = require("./launcher");
const updater_1 = require("./updater");
const isDev = !electron_1.app.isPackaged;
const APP_ROOT = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');
const OPENAI_TOKEN_PATH = path.join(os.homedir(), '.AIRE', 'openai-token.json');
const TOKEN_KEY_SALT = 'AIRE-openai-token';
// 自訂 URL Scheme：AIRE://oauth-callback?token=...
electron_1.app.setAsDefaultProtocolClient('AIRE');
let mainWindow = null;
let splashWindow = null;
const gotSingleInstanceLock = electron_1.app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    electron_1.app.quit();
}
else {
    // Windows/Linux：second-instance 時從 argv 取 URL
    electron_1.app.on('second-instance', (_event, argv) => {
        const url = argv.find((arg) => arg.startsWith('AIRE://'));
        if (url)
            handleOAuthCallback(url);
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
function getTokenEncryptionKey() {
    return crypto.scryptSync(electron_1.app.getPath('userData'), TOKEN_KEY_SALT, 32);
}
function encryptToken(token) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getTokenEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return {
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: encrypted.toString('base64'),
    };
}
function decryptToken(payload) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getTokenEncryptionKey(), Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    return Buffer.concat([
        decipher.update(Buffer.from(payload.data, 'base64')),
        decipher.final(),
    ]).toString('utf8');
}
function saveOpenAIToken(token) {
    fs.mkdirSync(path.dirname(OPENAI_TOKEN_PATH), { recursive: true });
    fs.writeFileSync(OPENAI_TOKEN_PATH, JSON.stringify(encryptToken(token)), { mode: 0o600 });
}
function readOpenAIToken() {
    try {
        const raw = fs.readFileSync(OPENAI_TOKEN_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed.token === 'string') {
            saveOpenAIToken(parsed.token);
            return { token: parsed.token };
        }
        if (parsed.iv && parsed.tag && parsed.data) {
            return { token: decryptToken(parsed) };
        }
        return null;
    }
    catch {
        return null;
    }
}
function resolveHtmlPath(fileName) {
    const inSameDir = path.join(__dirname, fileName);
    if (fs.existsSync(inSameDir))
        return inSameDir;
    return path.join(__dirname, '..', fileName);
}
function createSplashWindow() {
    splashWindow = new electron_1.BrowserWindow({
        width: 480,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    splashWindow.loadFile(resolveHtmlPath('splash.html'));
}
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.loadURL((0, launcher_1.getServerUrl)());
    mainWindow.once('ready-to-show', () => {
        splashWindow?.destroy();
        splashWindow = null;
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function createCodexGuideWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 600,
        height: 500,
        frame: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.loadFile(resolveHtmlPath('codex-guide.html'));
}
// IPC handlers
electron_1.ipcMain.handle('app:version', () => electron_1.app.getVersion());
electron_1.ipcMain.handle('shell:openExternal', (_e, url) => {
    void electron_1.shell.openExternal(url);
});
electron_1.ipcMain.handle('updater:check', () => {
    if (mainWindow)
        (0, updater_1.checkAndApplyUpdate)(mainWindow);
});
electron_1.ipcMain.handle('updater:install', () => {
    (0, updater_1.installUpdate)();
});
electron_1.ipcMain.handle('openai:getToken', () => {
    return readOpenAIToken();
});
electron_1.ipcMain.handle('openai:saveToken', (_e, token) => {
    saveOpenAIToken(token);
});
electron_1.ipcMain.handle('codex:detect', (_e, customPath) => {
    return (0, launcher_1.detectCodexCli)(customPath);
});
electron_1.ipcMain.handle('codex:proceedToApp', async () => {
    // 偵測通過後，啟動 Next.js server 並切換到主視窗
    splashWindow?.destroy();
    mainWindow?.destroy();
    createSplashWindow();
    try {
        await (0, launcher_1.launchNextServer)(APP_ROOT);
        createMainWindow();
        (0, updater_1.checkAndApplyUpdate)(mainWindow);
    }
    catch (err) {
        console.error('Failed to start:', err);
        electron_1.app.quit();
    }
});
// macOS：從 Dock/URL scheme 被打開時接收 URL
electron_1.app.on('open-url', (_event, url) => {
    handleOAuthCallback(url);
});
function handleOAuthCallback(url) {
    try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token');
        if (token && mainWindow && !mainWindow.isDestroyed()) {
            saveOpenAIToken(token);
            mainWindow.webContents.send('openai:tokenReceived', { token });
        }
    }
    catch {
        // 解析失敗忽略
    }
}
electron_1.app.whenReady().then(async () => {
    createSplashWindow();
    if (isDev) {
        // 開發模式：直接連 Next.js dev server
        createMainWindow();
    }
    else {
        // 偵測 Codex CLI
        const codexResult = (0, launcher_1.detectCodexCli)();
        if (!codexResult.found) {
            // 顯示安裝引導畫面（取代 splash）
            splashWindow?.destroy();
            splashWindow = null;
            createCodexGuideWindow();
            // 等待用戶安裝後重新偵測（透過 IPC）
            return;
        }
        // Codex CLI 已安裝，正常啟動
        try {
            await (0, launcher_1.launchNextServer)(APP_ROOT);
            createMainWindow();
            (0, updater_1.checkAndApplyUpdate)(mainWindow);
        }
        catch (err) {
            console.error('Failed to start Next.js server:', err);
            electron_1.app.quit();
        }
    }
});
electron_1.app.on('window-all-closed', () => {
    (0, launcher_1.stopNextServer)();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createMainWindow();
});
