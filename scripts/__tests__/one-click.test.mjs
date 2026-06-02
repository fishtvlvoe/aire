import { describe, expect, it, vi } from "vitest";

import {
  buildOneClickPlan,
  ensureSupportedPlatform,
  runOneClickPlan,
} from "../one-click-lib.mjs";

describe("one-click plan", () => {
  it("supports darwin and win32", () => {
    expect(() => ensureSupportedPlatform("darwin")).not.toThrow();
    expect(() => ensureSupportedPlatform("win32")).not.toThrow();
  });

  it("rejects unsupported platform", () => {
    expect(() => ensureSupportedPlatform("freebsd")).toThrow(/僅支援 macOS 或 Windows/i);
  });

  it("builds shared step order", () => {
    const plan = buildOneClickPlan({ runner: "corepack pnpm" });

    expect(plan.map((step) => step.id)).toEqual([
      "install",
      "approve-builds",
      "rebuild-native",
      "build-local-runtime",
      "launch",
    ]);
  });

  it("supports dry-run", async () => {
    const runCommand = vi.fn();
    const logger = { info: vi.fn(), error: vi.fn() };

    await runOneClickPlan({
      plan: buildOneClickPlan({ runner: "corepack pnpm" }),
      dryRun: true,
      runCommand,
      logger,
    });

    expect(runCommand).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("[dry-run]"));
  });
});
