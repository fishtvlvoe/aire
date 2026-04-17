import { exec } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { claudeCodeAdapter } from "../../adapters/claude-code";

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    exec: vi.fn(),
  };
});

type ExecCallback = (
  error: Error | null,
  result: { stdout: string; stderr: string }
) => void;

function mockExecSuccess(stdout: string, stderr = "") {
  vi.mocked(exec).mockImplementationOnce(
    (_cmd: string, _opts: unknown, cb?: unknown) => {
      const callback = (cb ?? _opts) as ExecCallback;
      callback(null, { stdout, stderr });
      return {} as ReturnType<typeof exec>;
    }
  );
}

function mockExecError(message: string, stderr = "") {
  vi.mocked(exec).mockImplementationOnce(
    (_cmd: string, _opts: unknown, cb?: unknown) => {
      const callback = (cb ?? _opts) as ExecCallback;
      const err = Object.assign(new Error(message), { stderr });
      callback(err, { stdout: "", stderr });
      return {} as ReturnType<typeof exec>;
    }
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("claudeCodeAdapter.run", () => {
  it("成功時回傳 success: true", async () => {
    mockExecSuccess("ok output");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result).toEqual({
      success: true,
      output: "ok output",
      status: "ready",
    });
  });

  it("未登入時回傳 not-logged-in", async () => {
    mockExecError("auth failed", "not logged in");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("not-logged-in");
  });

  it("一般錯誤時回傳 error", async () => {
    mockExecError("boom", "something failed");
    const result = await claudeCodeAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("error");
  });
});

describe("claudeCodeAdapter.check", () => {
  it("可用時回傳 ready", async () => {
    mockExecSuccess("claude 1.0.0");
    const status = await claudeCodeAdapter.check();
    expect(status).toBe("ready");
  });

  it("未登入時回傳 not-logged-in", async () => {
    mockExecError("auth failed", "not logged in");
    const status = await claudeCodeAdapter.check();
    expect(status).toBe("not-logged-in");
  });
});
