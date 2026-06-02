import { spawn, spawnSync } from "node:child_process";

/** @typedef {{ id: string, title: string, command: string }} OneClickStep */

/**
 * macOS / Windows 平台 guard。
 * @param {string} platform
 */
export function ensureSupportedPlatform(platform = process.platform) {
  if (platform !== "darwin" && platform !== "win32") {
    throw new Error("one-click 僅支援 macOS 或 Windows 平台");
  }
}

/**
 * 建立一鍵流程。
 * @param {{ runner: string }} options
 * @returns {OneClickStep[]}
 */
export function buildOneClickPlan({ runner }) {
  return [
    {
      id: "install",
      title: "安裝依賴",
      command: `${runner} install`,
    },
    {
      id: "approve-builds",
      title: "核准建置腳本",
      command: `${runner} approve-builds --all`,
    },
    {
      id: "rebuild-native",
      title: "重建 better-sqlite3",
      command: `${runner} rebuild better-sqlite3`,
    },
    {
      id: "build-local-runtime",
      title: "建立本機 runtime",
      command: `${runner} build:local-runtime`,
    },
    {
      id: "launch",
      title: "啟動 AIRE",
      command: `${runner} launch`,
    },
  ];
}

/**
 * 執行一鍵流程（可 dry-run）。
 * @param {{
 *   plan: OneClickStep[],
 *   runCommand?: (command: string) => Promise<{ ok: boolean, exitCode?: number }>,
 *   dryRun?: boolean,
 *   logger?: { info: (message: string) => void, error: (message: string) => void }
 * }} options
 */
export async function runOneClickPlan({
  plan,
  runCommand = executeShellCommand,
  dryRun = false,
  logger = console,
}) {
  for (const step of plan) {
    logger.info(`▶ [${step.id}] ${step.title}`);
    logger.info(`   ${step.command}`);

    if (dryRun) {
      logger.info("   [dry-run] skip");
      continue;
    }

    const result = await runCommand(step.command);
    if (!result.ok) {
      const exitCode = result.exitCode ?? -1;
      const message = `[${step.id}] 失敗（exit ${exitCode}）：${step.command}`;
      logger.error(message);
      throw new Error(message);
    }

    logger.info(`✓ [${step.id}] 完成`);
  }
}

/**
 * 解析 pnpm runner：優先 corepack，其次 pnpm。
 * @param {{ hasCommand?: (probe: string) => boolean }} options
 */
export function resolvePnpmRunner({ hasCommand = probeCommand } = {}) {
  if (hasCommand("corepack --version")) {
    return "corepack pnpm";
  }
  if (hasCommand("pnpm --version")) {
    return "pnpm";
  }
  throw new Error("找不到可用的 pnpm runner（需 corepack 或 pnpm）");
}

/**
 * @param {string} probe
 */
function probeCommand(probe) {
  const result = spawnSync(probe, {
    shell: true,
    stdio: "ignore",
    env: process.env,
  });
  return result.status === 0;
}

/**
 * @param {string} command
 */
function executeShellCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      resolve({ ok: code === 0, exitCode: code ?? -1 });
    });
  });
}
