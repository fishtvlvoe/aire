import {
  buildOneClickPlan,
  resolvePnpmRunner,
  runOneClickPlan,
} from "./one-click-lib.mjs";

/**
 * Windows 專用 guard。
 * @param {string} platform
 */
export function ensureWindowsPlatform(platform = process.platform) {
  if (platform !== "win32") {
    throw new Error("windows:one-click 僅支援 Windows 平台");
  }
}

/**
 * 建立 Windows 一鍵流程。
 * @param {{ runner: string }} options
 */
export function buildWindowsOneClickPlan({ runner }) {
  return buildOneClickPlan({ runner });
}

/**
 * 執行 Windows 一鍵流程（可 dry-run）。
 */
export async function runWindowsOneClickPlan(options) {
  return runOneClickPlan(options);
}

export { resolvePnpmRunner };
