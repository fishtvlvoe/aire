import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { launchNextServer, stopNextServer, getServerUrl, detectCodexCli } from './launcher';
import { checkAndApplyUpdate, installUpdate } from './updater';

const isDev = !app.isPackaged;
const APP_ROOT = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');
const OPENAI_TOKEN_PATH = path.join(os.homedir(), '.three-ai', 'openai-token.json');
const TOKEN_KEY_SALT = 'three-ai-openai-token';

interface EncryptedTokenPayload {
  iv: string;
  tag: string;
  data: string;
}

// 自訂 URL Scheme：three-ai://oauth-callback?token=...
app.setAsDefaultProtocolClient('three-ai');

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  // Windows/Linux：second-instance 時從 argv 取 URL
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith('three-ai://'));
    if (url) handleOAuthCallback(url);

    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getTokenEncryptionKey(): Buffer {
  return crypto.scryptSync(app.getPath('userData'), TOKEN_KEY_SALT, 32);
}

function encryptToken(token: string): EncryptedTokenPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getTokenEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
}

function decryptToken(payload: EncryptedTokenPayload): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getTokenEncryptionKey(),
    Buffer.from(payload.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function saveOpenAIToken(token: string): void {
  fs.mkdirSync(path.dirname(OPENAI_TOKEN_PATH), { recursive: true });
  fs.writeFileSync(OPENAI_TOKEN_PATH, JSON.stringify(encryptToken(token)), { mode: 0o600 });
}

function readOpenAIToken(): { token: string } | null {
  try {
    const raw = fs.readFileSync(OPENAI_TOKEN_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<EncryptedTokenPayload> & { token?: string };
    if (typeof parsed.token === 'string') {
      saveOpenAIToken(parsed.token);
      return { token: parsed.token };
    }
    if (parsed.iv && parsed.tag && parsed.data) {
      return { token: decryptToken(parsed as EncryptedTokenPayload) };
    }
    return null;
  } catch {
    return null;
  }
}

function resolveHtmlPath(fileName: string): string {
  const inSameDir = path.join(__dirname, fileName);
  if (fs.existsSync(inSameDir)) return inSameDir;
  return path.join(__dirname, '..', fileName);
}

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
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

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
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

  mainWindow.loadURL(getServerUrl());

  mainWindow.once('ready-to-show', () => {
    splashWindow?.destroy();
    splashWindow = null;
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createCodexGuideWindow(): void {
  mainWindow = new BrowserWindow({
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
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('shell:openExternal', (_e, url: string) => {
  void shell.openExternal(url);
});

ipcMain.handle('updater:check', () => {
  if (mainWindow) checkAndApplyUpdate(mainWindow);
});

ipcMain.handle('updater:install', () => {
  installUpdate();
});

ipcMain.handle('openai:getToken', () => {
  return readOpenAIToken();
});

ipcMain.handle('openai:saveToken', (_e, token: string) => {
  saveOpenAIToken(token);
});

ipcMain.handle('codex:detect', (_e, customPath?: string) => {
  return detectCodexCli(customPath);
});

ipcMain.handle('codex:proceedToApp', async () => {
  // 偵測通過後，啟動 Next.js server 並切換到主視窗
  splashWindow?.destroy();
  mainWindow?.destroy();
  createSplashWindow();
  try {
    await launchNextServer(APP_ROOT);
    createMainWindow();
    checkAndApplyUpdate(mainWindow!);
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

// macOS：從 Dock/URL scheme 被打開時接收 URL
app.on('open-url', (_event, url) => {
  handleOAuthCallback(url);
});

function handleOAuthCallback(url: string): void {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token && mainWindow && !mainWindow.isDestroyed()) {
      saveOpenAIToken(token);
      mainWindow.webContents.send('openai:tokenReceived', { token });
    }
  } catch {
    // 解析失敗忽略
  }
}

app.whenReady().then(async () => {
  createSplashWindow();

  if (isDev) {
    // 開發模式：直接連 Next.js dev server
    createMainWindow();
  } else {
    // 偵測 Codex CLI
    const codexResult = detectCodexCli();
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
      await launchNextServer(APP_ROOT);
      createMainWindow();
      checkAndApplyUpdate(mainWindow!);
    } catch (err) {
      console.error('Failed to start Next.js server:', err);
      app.quit();
    }
  }
});

app.on('window-all-closed', () => {
  stopNextServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
