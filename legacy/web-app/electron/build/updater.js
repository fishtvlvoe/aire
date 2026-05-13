"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndApplyUpdate = checkAndApplyUpdate;
exports.installUpdate = installUpdate;
const electron_updater_1 = require("electron-updater");
const UPDATE_STATUS_CHANNEL = 'update-status';
let listenersBound = false;
function sendStatus(win, status, progress, message) {
    if (!win.isDestroyed()) {
        win.webContents.send(UPDATE_STATUS_CHANNEL, { status, progress, message });
    }
}
function bindUpdaterListeners(win) {
    if (listenersBound)
        return;
    listenersBound = true;
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        sendStatus(win, 'checking');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        sendStatus(win, 'available', undefined, `發現新版本 v${info.version}`);
    });
    electron_updater_1.autoUpdater.on('update-not-available', () => {
        sendStatus(win, 'up-to-date');
    });
    electron_updater_1.autoUpdater.on('download-progress', (progress) => {
        sendStatus(win, 'progress', Math.round(progress.percent));
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        sendStatus(win, 'ready', 100, `v${info.version} 已下載完成，請重啟安裝`);
    });
    electron_updater_1.autoUpdater.on('error', (error) => {
        sendStatus(win, 'error', undefined, error.message);
    });
}
async function checkAndApplyUpdate(win) {
    electron_updater_1.autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'fishtvlvoe',
        repo: 'AIRE',
    });
    electron_updater_1.autoUpdater.autoDownload = true;
    bindUpdaterListeners(win);
    await electron_updater_1.autoUpdater.checkForUpdates();
}
function installUpdate() {
    electron_updater_1.autoUpdater.quitAndInstall();
}
