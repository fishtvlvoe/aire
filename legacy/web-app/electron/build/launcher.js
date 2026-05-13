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
exports.getServerPort = getServerPort;
exports.getServerUrl = getServerUrl;
exports.launchNextServer = launchNextServer;
exports.stopNextServer = stopNextServer;
exports.detectCodexCli = detectCodexCli;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const PORT = 3000;
const READY_TIMEOUT_MS = 60000;
const POLL_INTERVAL_MS = 500;
let serverProcess = null;
function getServerPort() {
    return PORT;
}
function getServerUrl() {
    return `http://localhost:${PORT}`;
}
/** 啟動 Next.js standalone server，回傳 Promise（server ready 後 resolve） */
function launchNextServer(appRoot) {
    return new Promise((resolve, reject) => {
        const serverScript = path.join(appRoot, '.next', 'standalone', 'server.js');
        if (!fs.existsSync(serverScript)) {
            reject(new Error(`Next.js standalone server not found: ${serverScript}`));
            return;
        }
        serverProcess = (0, child_process_1.spawn)(process.execPath, [serverScript], {
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
            if (code !== 0)
                reject(new Error(`Next.js server exited with code ${code}`));
        });
        waitForServer(resolve, reject);
    });
}
function waitForServer(resolve, reject) {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    const poll = () => {
        http
            .get(getServerUrl(), (res) => {
            res.resume();
            if (res.statusCode && res.statusCode < 500) {
                resolve();
            }
            else {
                scheduleNextPoll();
            }
        })
            .on('error', () => {
            if (Date.now() > deadline) {
                reject(new Error('Timed out waiting for Next.js server'));
            }
            else {
                scheduleNextPoll();
            }
        });
    };
    const scheduleNextPoll = () => setTimeout(poll, POLL_INTERVAL_MS);
    poll();
}
function stopNextServer() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
}
/** 偵測 Codex CLI 是否安裝 */
function detectCodexCli(customPath) {
    // 如果有自訂路徑，檢查該路徑
    if (customPath) {
        try {
            fs.accessSync(customPath, fs.constants.X_OK);
            return { found: true, path: customPath };
        }
        catch {
            return { found: false, path: null };
        }
    }
    // macOS: which codex, Windows: where codex
    const cmd = process.platform === 'win32' ? 'where codex' : 'which codex';
    try {
        const result = (0, child_process_1.execSync)(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
        return { found: true, path: result.split('\n')[0] };
    }
    catch {
        return { found: false, path: null };
    }
}
