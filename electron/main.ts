import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { launchNextServer, stopNextServer, getServerUrl } from './launcher';
import { checkAndApplyUpdate, installUpdate } from './updater';

const isDev = !app.isPackaged;
const APP_ROOT = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');
const OPENAI_TOKEN_PATH = path.join(os.homedir(), '.three-ai', 'openai-token.json');

// 自訂 URL Scheme：three-ai://oauth-callback?token=...
app.setAsDefaultProtocolClient('three-ai');

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

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

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
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
  try {
    const raw = fs.readFileSync(OPENAI_TOKEN_PATH, 'utf8');
    return JSON.parse(raw) as { token: string };
  } catch {
    return null;
  }
});

ipcMain.handle('openai:saveToken', (_e, token: string) => {
  fs.mkdirSync(path.dirname(OPENAI_TOKEN_PATH), { recursive: true });
  fs.writeFileSync(OPENAI_TOKEN_PATH, JSON.stringify({ token }));
});

// macOS：從 Dock/URL scheme 被打開時接收 URL
app.on('open-url', (_event, url) => {
  handleOAuthCallback(url);
});

// Windows/Linux：second-instance 時從 argv 取 URL
app.on('second-instance', (_event, argv) => {
  const url = argv.find((arg) => arg.startsWith('three-ai://'));
  if (url) handleOAuthCallback(url);
  if (mainWindow) { mainWindow.focus(); }
});

function handleOAuthCallback(url: string): void {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token && mainWindow && !mainWindow.isDestroyed()) {
      fs.mkdirSync(path.dirname(OPENAI_TOKEN_PATH), { recursive: true });
      fs.writeFileSync(OPENAI_TOKEN_PATH, JSON.stringify({ token }));
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
