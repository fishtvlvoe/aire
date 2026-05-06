import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

const UPDATE_CHECK_URL = process.env.LICENSE_SERVER_URL
  ? `${process.env.LICENSE_SERVER_URL}/api/updates/check`
  : 'https://license.three-ai.app/api/updates/check';
const UPDATE_STATUS_CHANNEL = 'update-status';
let listenersBound = false;

function sendStatus(
  win: BrowserWindow,
  status: string,
  progress?: number,
  message?: string,
): void {
  if (!win.isDestroyed()) {
    win.webContents.send(UPDATE_STATUS_CHANNEL, { status, progress, message });
  }
}

function bindUpdaterListeners(win: BrowserWindow): void {
  if (listenersBound) return;
  listenersBound = true;

  autoUpdater.on('checking-for-update', () => {
    sendStatus(win, 'checking');
  });
  autoUpdater.on('update-available', (info) => {
    sendStatus(win, 'available', undefined, `發現新版本 v${info.version}`);
  });
  autoUpdater.on('update-not-available', () => {
    sendStatus(win, 'up-to-date');
  });
  autoUpdater.on('download-progress', (progress) => {
    sendStatus(win, 'progress', Math.round(progress.percent));
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendStatus(win, 'ready', 100, `v${info.version} 已下載完成，請重啟安裝`);
  });
  autoUpdater.on('error', (error) => {
    sendStatus(win, 'error', undefined, error.message);
  });
}

export async function checkAndApplyUpdate(win: BrowserWindow): Promise<void> {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: UPDATE_CHECK_URL,
  });
  autoUpdater.autoDownload = true;
  bindUpdaterListeners(win);
  await autoUpdater.checkForUpdates();
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
