#!/usr/bin/env node

import {
  buildOneClickPlan,
  ensureSupportedPlatform,
  resolvePnpmRunner,
  runOneClickPlan,
} from "./one-click-lib.mjs";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  ensureSupportedPlatform();

  const runner = resolvePnpmRunner();
  const plan = buildOneClickPlan({ runner });

  console.info(`▶ one-click runner = ${runner}`);
  await runOneClickPlan({ plan, dryRun, logger: console });

  if (dryRun) {
    console.info("✓ one-click dry-run 完成");
    return;
  }

  console.info("✓ one-click 完成，AIRE 啟動中");
}

main().catch((error) => {
  console.error("✗ one-click 失敗：", error.message);
  process.exit(1);
});
