import { describe, expect, it, vi } from "vitest";

import {
  buildWindowsOneClickPlan,
  ensureWindowsPlatform,
  resolvePnpmRunner,
  runWindowsOneClickPlan,
} from "../windows-one-click-lib.mjs";

describe("windows-one-click plan", () => {
  it("builds expected step order for Windows", () => {
    const plan = buildWindowsOneClickPlan({ runner: "corepack pnpm" });

    expect(plan.map((step) => step.id)).toEqual([
      "install",
      "approve-builds",
      "rebuild-native",
      "build-local-runtime",
      "launch",
    ]);

    expect(plan[0].command).toBe("corepack pnpm install");
    expect(plan[4].command).toBe("corepack pnpm launch");
  });

  it("fails fast on non-Windows platform", () => {
    expect(() => ensureWindowsPlatform("darwin")).toThrow(/僅支援 Windows/i);
  });

  it("stops at first failing step", async () => {
    const runner = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, exitCode: 1 });

    await expect(
      runWindowsOneClickPlan({
        plan: buildWindowsOneClickPlan({ runner: "corepack pnpm" }),
        runCommand: runner,
        logger: { info: vi.fn(), error: vi.fn() },
      })
    ).rejects.toThrow(/approve-builds/i);

    expect(runner).toHaveBeenCalledTimes(2);
  });

  it("supports dry-run without executing commands", async () => {
    const runner = vi.fn();
    const logger = { info: vi.fn(), error: vi.fn() };

    await runWindowsOneClickPlan({
      plan: buildWindowsOneClickPlan({ runner: "corepack pnpm" }),
      runCommand: runner,
      dryRun: true,
      logger,
    });

    expect(runner).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("[dry-run]"));
  });

  it("prefers corepack pnpm when corepack is available", () => {
    const runner = resolvePnpmRunner({
      hasCommand: (probe) => probe === "corepack --version",
    });

    expect(runner).toBe("corepack pnpm");
  });
});
