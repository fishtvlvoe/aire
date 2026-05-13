import { exec, spawn } from "child_process";
import { EventEmitter } from "events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiAdapter } from "../../adapters/gemini";

// Mock child_process (both exec and spawn)
vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    exec: vi.fn(),
    spawn: vi.fn(),
  };
});

// Mock fs (createReadStream + promises.writeFile/unlink)
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const mockStream = new EventEmitter() as any;
  mockStream.pipe = vi.fn();
  return {
    ...actual,
    createReadStream: vi.fn(() => mockStream),
    promises: {
      ...actual.promises,
      writeFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
    },
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

function mockSpawnSuccess(stdout: string, stderr = "") {
  vi.mocked(spawn).mockImplementationOnce(() => {
    const child = new EventEmitter() as any;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = { write: vi.fn(), end: vi.fn() };
    child.kill = vi.fn();
    setTimeout(() => {
      if (stdout) child.stdout.emit("data", Buffer.from(stdout));
      if (stderr) child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", 0);
    }, 0);
    return child;
  });
}

function mockSpawnError(stderr: string) {
  vi.mocked(spawn).mockImplementationOnce(() => {
    const child = new EventEmitter() as any;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = { write: vi.fn(), end: vi.fn() };
    child.kill = vi.fn();
    setTimeout(() => {
      child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", 1);
    }, 0);
    return child;
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("geminiAdapter.run", () => {
  it("成功時回傳 success: true", async () => {
    mockSpawnSuccess("gemini output");
    const result = await geminiAdapter.run("prompt", 5000);
    expect(result).toEqual({
      success: true,
      output: "gemini output",
      status: "ready",
    });
  });

  it("quota exceeded 時回傳 quota-exceeded", async () => {
    mockSpawnError("quota exceeded 429");
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
