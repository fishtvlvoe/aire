import { spawn } from "child_process";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { claudeCodeAdapter } from "../../adapters/claude-code";

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

function mockSpawnResult(stdout: string, stderr = "") {
  vi.mocked(spawn).mockImplementationOnce(() => {
    const child = new EventEmitter() as ReturnType<typeof spawn>;
    child.stdout = new EventEmitter() as ReturnType<typeof spawn>["stdout"];
    child.stderr = new EventEmitter() as ReturnType<typeof spawn>["stderr"];
    child.stdin = {
      write: vi.fn(),
      end: vi.fn(),
    } as unknown as ReturnType<typeof spawn>["stdin"];

    process.nextTick(() => {
      if (stdout) child.stdout.emit("data", Buffer.from(stdout));
      if (stderr) child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", 0);
    });

    return child;
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("claudeCodeAdapter.run", () => {
  it("成功時回傳 success: true", async () => {
    mockSpawnResult("ok output");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result).toEqual({
      success: true,
      output: "ok output",
      status: "ready",
    });
  });

  it("未登入時回傳 not-logged-in", async () => {
    mockSpawnResult("", "not logged in");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("not-logged-in");
  });

  it("一般錯誤時回傳 error", async () => {
    mockSpawnResult("", "something failed");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("error");
  });
});

describe("claudeCodeAdapter.check", () => {
  it("可用時回傳 ready", async () => {
    mockSpawnResult("claude 1.0.0");
    const status = await claudeCodeAdapter.check();
    expect(status).toBe("ready");
  });

  it("未登入時回傳 not-logged-in", async () => {
    mockSpawnResult("", "not logged in");
    const status = await claudeCodeAdapter.check();
    expect(status).toBe("not-logged-in");
  });
});
