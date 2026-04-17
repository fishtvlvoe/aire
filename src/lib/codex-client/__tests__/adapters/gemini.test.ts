import { exec } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiAdapter } from "../../adapters/gemini";

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

describe("geminiAdapter.run", () => {
  it("成功時回傳 success: true", async () => {
    mockExecSuccess("gemini output");
    const result = await geminiAdapter.run("prompt", 5000);
    expect(result).toEqual({
      success: true,
      output: "gemini output",
      status: "ready",
    });
  });

  it("quota exceeded 時回傳 quota-exceeded", async () => {
    mockExecError("too many requests", "quota exceeded 429");
    const result = await geminiAdapter.run("prompt", 5000);
    expect(result.success).toBe(false);
    expect(result.status).toBe("quota-exceeded");
  });
});

describe("geminiAdapter.check", () => {
  it("可用時回傳 ready", async () => {
    mockExecSuccess("gemini 1.0.0");
    const status = await geminiAdapter.check();
    expect(status).toBe("ready");
  });
});
