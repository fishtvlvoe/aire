#!/usr/bin/env node

import {
  buildWindowsOneClickPlan,
  ensureWindowsPlatform,
  resolvePnpmRunner,
  runWindowsOneClickPlan,
} from "./windows-one-click-lib.mjs";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  ensureWindowsPlatform();

  const runner = resolvePnpmRunner();
  const plan = buildWindowsOneClickPlan({ runner });

  console.info(`▶ windows:one-click runner = ${runner}`);
  await runWindowsOneClickPlan({ plan, dryRun, logger: console });

  if (dryRun) {
    console.info("✓ windows:one-click dry-run 完成");
    return;
  }

  console.info("✓ windows:one-click 完成，AIRE 啟動中");
}

main().catch((error) => {
  console.error("✗ windows:one-click 失敗：", error.message);
  process.exit(1);
});
