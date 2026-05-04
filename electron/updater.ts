import { BrowserWindow, ipcMain } from 'electron';
import { createHash } from 'crypto';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const UPDATE_CHECK_URL = process.env.LICENSE_SERVER_URL
  ? `${process.env.LICENSE_SERVER_URL}/api/updates/check`
  : 'https://license.three-ai.app/api/updates/check';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  hash: string;
  releaseNotes?: string;
}

function sendStatus(
  win: BrowserWindow,
  status: string,
  progress?: number,
  message?: string,
): void {
  if (!win.isDestroyed()) {
    win.webContents.send('update:status', { status, progress, message });
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()) as T);
        } catch {
          reject(new Error('Invalid JSON response from update server'));
        }
      });
    }).on('error', reject);
  });
}

async function downloadFile(url: string, dest: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      const total = parseInt(res.headers['content-length'] ?? '0', 10);
      let received = 0;
      res.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (total > 0) onProgress(Math.round((received / total) * 100));
        file.write(chunk);
      });
      res.on('end', () => { file.end(); resolve(); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function verifyHash(filePath: string, expectedHash: string): boolean {
  const content = fs.readFileSync(filePath);
  const actual = createHash('sha256').update(content).digest('hex');
  return actual === expectedHash;
}

export async function checkAndApplyUpdate(win: BrowserWindow): Promise<void> {
  try {
    const licenseKey = process.env.LICENSE_KEY ?? '';
    const url = `${UPDATE_CHECK_URL}?key=${encodeURIComponent(licenseKey)}&version=${app.getVersion()}`;
    const info = await fetchJson<UpdateInfo & { upToDate?: boolean }>(url);

    if (info.upToDate) {
      sendStatus(win, 'up-to-date');
      return;
    }

    sendStatus(win, 'downloading', 0, `正在下載 v${info.version}`);

    const tmpPath = path.join(app.getPath('temp'), `three-ai-update-${info.version}`);
    await downloadFile(info.downloadUrl, tmpPath, (pct) => sendStatus(win, 'downloading', pct));

    if (!verifyHash(tmpPath, info.hash)) {
      fs.unlinkSync(tmpPath);
      sendStatus(win, 'error', undefined, '更新檔案驗證失敗');
      return;
    }

    sendStatus(win, 'ready', 100, `v${info.version} 已就緒，重啟後完成安裝`);

    // macOS/Windows: open installer and quit
    const { shell } = await import('electron');
    await shell.openPath(tmpPath);
    app.quit();
  } catch {
    // 更新失敗不阻塞主流程
    sendStatus(win, 'error', undefined, '檢查更新失敗，請稍後再試');
  }
}
