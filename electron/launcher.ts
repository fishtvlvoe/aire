import { execSync, spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';

const PORT = 3000;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

let serverProcess: ChildProcess | null = null;

export function getServerPort(): number {
  return PORT;
}

export function getServerUrl(): string {
  return `http://localhost:${PORT}`;
}

/** 啟動 Next.js standalone server，回傳 Promise（server ready 後 resolve） */
export function launchNextServer(appRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(appRoot, '.next', 'standalone', 'server.js');

    if (!fs.existsSync(serverScript)) {
      reject(new Error(`Next.js standalone server not found: ${serverScript}`));
      return;
    }

    serverProcess = spawn(process.execPath, [serverScript], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      cwd: path.join(appRoot, '.next', 'standalone'),
      stdio: 'pipe',
    });

    serverProcess.on('error', reject);
    serverProcess.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Next.js server exited with code ${code}`));
    });

    waitForServer(resolve, reject);
  });
}

function waitForServer(
  resolve: () => void,
  reject: (err: Error) => void,
): void {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  const poll = () => {
    http
      .get(getServerUrl(), (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          scheduleNextPoll();
        }
      })
      .on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('Timed out waiting for Next.js server'));
        } else {
          scheduleNextPoll();
        }
      });
  };

  const scheduleNextPoll = () => setTimeout(poll, POLL_INTERVAL_MS);
  poll();
}

export function stopNextServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

/** 偵測 Codex CLI 是否安裝 */
export function detectCodexCli(
  customPath?: string,
): { found: boolean; path: string | null } {
  // 如果有自訂路徑，檢查該路徑
  if (customPath) {
    try {
      fs.accessSync(customPath, fs.constants.X_OK);
      return { found: true, path: customPath };
    } catch {
      return { found: false, path: null };
    }
  }

  // macOS: which codex, Windows: where codex
  const cmd = process.platform === 'win32' ? 'where codex' : 'which codex';
  try {
    const result = execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
    return { found: true, path: result.split('\n')[0] };
  } catch {
    return { found: false, path: null };
  }
}
